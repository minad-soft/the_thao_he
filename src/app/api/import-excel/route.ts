import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import * as XLSX from "xlsx";

interface ExcelRow {
  ho_ten: string;
  sdt?: string;
  ma_the: string;
  school_id?: string;
  ten_truong_khac?: string;
  ghi_chu?: string;
  package_id?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

/**
 * POST /api/import-excel — Import học viên từ file Excel
 * Tuân thủ DESIGN.md mục D:
 * - Mã thẻ bắt buộc nhập trong file Excel
 * - Validate trùng lặp nội bộ file VÀ trùng với DB
 * - Lỗi ở 1 dòng → dừng toàn bộ, không insert dòng nào
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const defaultPackageId = formData.get("package_id") as string | null;
    const defaultSchoolId = formData.get("school_id") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Chưa chọn file Excel" }, { status: 400 });
    }

    // Parse Excel file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    if (rawRows.length === 0) {
      return NextResponse.json({ error: "File Excel rỗng" }, { status: 400 });
    }

    // Map column names (hỗ trợ nhiều tên cột)
    const rows: ExcelRow[] = rawRows.map((raw) => ({
      ho_ten: String(raw["Họ tên"] || raw["ho_ten"] || raw["HoTen"] || raw["full_name"] || "").trim(),
      sdt: String(raw["SĐT"] || raw["sdt"] || raw["SDT"] || raw["phone"] || "").trim() || undefined,
      ma_the: String(raw["Mã thẻ"] || raw["ma_the"] || raw["MaThe"] || raw["card_code"] || "").trim(),
      school_id: String(raw["school_id"] || defaultSchoolId || "").trim() || undefined,
      ten_truong_khac: String(raw["Tên trường khác"] || raw["ten_truong_khac"] || "").trim() || undefined,
      ghi_chu: String(raw["Ghi chú"] || raw["ghi_chu"] || raw["notes"] || "").trim() || undefined,
      package_id: String(raw["package_id"] || defaultPackageId || "").trim() || undefined,
    }));

    // ==================== VALIDATION ====================
    const errors: ValidationError[] = [];

    // 1. Validate trường bắt buộc
    rows.forEach((row, idx) => {
      const rowNum = idx + 2; // +2 vì Excel row 1 là header
      if (!row.ho_ten) {
        errors.push({ row: rowNum, field: "Họ tên", message: "Họ tên không được để trống" });
      }
      if (!row.ma_the) {
        errors.push({ row: rowNum, field: "Mã thẻ", message: "Mã thẻ không được để trống" });
      }
    });

    // 2. Validate trùng lặp nội bộ file
    const cardCodesInFile = rows.map((r) => r.ma_the).filter(Boolean);
    const duplicateSet = new Set<string>();
    const seenCodes = new Set<string>();

    cardCodesInFile.forEach((code) => {
      if (seenCodes.has(code)) {
        duplicateSet.add(code);
      }
      seenCodes.add(code);
    });

    if (duplicateSet.size > 0) {
      rows.forEach((row, idx) => {
        if (duplicateSet.has(row.ma_the)) {
          errors.push({
            row: idx + 2,
            field: "Mã thẻ",
            message: `Mã thẻ "${row.ma_the}" bị trùng lặp trong file Excel`,
          });
        }
      });
    }

    // 3. Validate trùng lặp với Database
    if (cardCodesInFile.length > 0) {
      const { data: existingCards } = await supabaseAdmin
        .from("registrations")
        .select("card_code")
        .in("card_code", cardCodesInFile);

      if (existingCards && existingCards.length > 0) {
        const existingSet = new Set(existingCards.map((c) => c.card_code));
        rows.forEach((row, idx) => {
          if (existingSet.has(row.ma_the)) {
            errors.push({
              row: idx + 2,
              field: "Mã thẻ",
              message: `Mã thẻ "${row.ma_the}" đã tồn tại trong hệ thống`,
            });
          }
        });
      }
    }

    // Nếu có BẤT KỲ lỗi nào → DỪNG, trả danh sách lỗi
    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "Phát hiện lỗi trong file Excel. Không có dữ liệu nào được import.",
          errors,
          total_rows: rows.length,
          error_count: errors.length,
        },
        { status: 422 }
      );
    }

    // ==================== BULK INSERT ====================
    let insertedCount = 0;

    for (const row of rows) {
      // Insert student
      const { data: student, error: studentErr } = await supabaseAdmin
        .from("students")
        .insert({
          full_name: row.ho_ten,
          phone_number: row.sdt || null,
          school_id: row.school_id || null,
          other_school_name: row.ten_truong_khac || null,
          notes: row.ghi_chu || null,
        })
        .select("id")
        .single();

      if (studentErr || !student) {
        return NextResponse.json(
          { error: `Lỗi insert học viên "${row.ho_ten}": ${studentErr?.message}` },
          { status: 500 }
        );
      }

      // Get sessions_count from package
      let remainingSessions: number | null = null;
      if (row.package_id) {
        const { data: pkg } = await supabaseAdmin
          .from("pricing_packages")
          .select("sessions_count")
          .eq("id", row.package_id)
          .single();
        if (pkg) remainingSessions = pkg.sessions_count;
      }

      // Insert registration
      const { error: regErr } = await supabaseAdmin
        .from("registrations")
        .insert({
          student_id: student.id,
          package_id: row.package_id || null,
          card_code: row.ma_the,
          status: "ACTIVE",
          remaining_sessions: remainingSessions,
        });

      if (regErr) {
        return NextResponse.json(
          { error: `Lỗi insert ghi danh "${row.ma_the}": ${regErr.message}` },
          { status: 500 }
        );
      }

      insertedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Import thành công ${insertedCount} học viên`,
      inserted_count: insertedCount,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Lỗi xử lý file: " + (err instanceof Error ? err.message : "Unknown") },
      { status: 500 }
    );
  }
}
