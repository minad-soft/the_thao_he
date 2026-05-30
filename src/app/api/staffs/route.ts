import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { StaffInsert } from "@/types/database.types";

// GET /api/staffs — Lấy danh sách toàn bộ nhân viên
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("staffs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/staffs — Thêm nhân viên mới
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { full_name, username, phone_number, role, password, status } = body;

    // Validation cơ bản
    if (!full_name?.trim()) {
      return NextResponse.json({ error: "Họ tên không được để trống" }, { status: 400 });
    }
    if (!username?.trim()) {
      return NextResponse.json({ error: "Tên đăng nhập không được để trống" }, { status: 400 });
    }
    if (!password?.trim()) {
      return NextResponse.json({ error: "Mật khẩu không được để trống" }, { status: 400 });
    }
    if (!role || !["ADMIN", "STAFF", "ACCOUNTANT"].includes(role)) {
      return NextResponse.json({ error: "Phân quyền không hợp lệ" }, { status: 400 });
    }

    // Kiểm tra tên đăng nhập đã tồn tại chưa (Server-side validation)
    const { data: existingStaff, error: checkError } = await supabaseAdmin
      .from("staffs")
      .select("id")
      .eq("username", username.trim())
      .maybeSingle();

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (existingStaff) {
      return NextResponse.json({ error: "Tên đăng nhập đã tồn tại trên hệ thống" }, { status: 409 });
    }

    const insertData: StaffInsert = {
      full_name: full_name.trim(),
      username: username.trim(),
      phone_number: phone_number?.trim() || null,
      role: role as 'ADMIN' | 'STAFF' | 'ACCOUNTANT',
      password: password,
      status: (status || "ACTIVE") as 'ACTIVE' | 'INACTIVE',
    };

    const { data, error } = await supabaseAdmin
      .from("staffs")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 500 });
  }
}
