"use client";

import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import StudentsTable from "@/modules/students/StudentsTable";
import ExcelUploader from "@/modules/students/ExcelUploader";
import "./students.css";

export default function StudentsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [students, setStudents] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDebtOnly, setFilterDebtOnly] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsRes, schoolsRes, packagesRes, paymentMethodsRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/schools"),
        fetch("/api/pricing-packages"),
        fetch("/api/payment-methods")
      ]);

      if (studentsRes.ok) setStudents(await studentsRes.json());
      if (schoolsRes.ok) setSchools(await schoolsRes.json());
      if (packagesRes.ok) setPackages(await packagesRes.json());
      if (paymentMethodsRes.ok) setPaymentMethods(await paymentMethodsRes.json());
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter theo search và công nợ
  const filteredStudents = students.filter((s) => {
    const reg = s.registrations?.[0];
    
    const matchesSearch = (() => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const matchName = s.full_name?.toLowerCase().includes(term);
      const matchPhone = s.phone_number?.toLowerCase().includes(term);
      const matchCode = reg?.card_code?.toLowerCase().includes(term);
      return matchName || matchPhone || matchCode;
    })();

    const matchesDebt = filterDebtOnly ? (reg && reg.debt_amount > 0 && reg.status === "ACTIVE") : true;

    return matchesSearch && matchesDebt;
  });

  const exportToExcel = () => {
    if (students.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    const dataToExport = filteredStudents.map((s, index) => {
      const reg = s.registrations?.[0];
      const paymentMethodsStr = reg?.registration_payments && reg.registration_payments.length > 0
        ? reg.registration_payments.map((p: any) => `${p.payment_methods?.method_name || "Chưa rõ"}: ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p.amount)}`).join(", ")
        : reg?.payment_methods?.method_name || "";

      return {
        "STT": index + 1,
        "Họ tên": s.full_name,
        "Ngày sinh": s.dob ? new Date(s.dob).toLocaleDateString("vi-VN") : "",
        "Giới tính": s.gender || "",
        "Lớp": s.class_name || "",
        "Số điện thoại": s.phone_number || "",
        "Trường": s.schools ? s.schools.school_name : s.other_school_name || "",
        "Ghi chú": s.notes || "",
        "Mã thẻ": reg?.card_code || "",
        "Gói học": reg?.pricing_packages?.package_name || "",
        "Giá gói (VNĐ)": reg?.pricing_packages?.price || 0,
        "Đã thanh toán (VNĐ)": reg?.amount_paid || 0,
        "Công nợ (VNĐ)": reg?.debt_amount || 0,
        "Số buổi": reg?.remaining_sessions || "",
        "Số phiếu thu": reg?.receipt_number || "",
        "Hình thức thanh toán": paymentMethodsStr,
        "Trạng thái": reg?.status === "ACTIVE" ? "Hoạt động" : reg?.status || "",
        "Ngày đăng ký": new Date(s.created_at).toLocaleDateString("vi-VN"),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachHocVien");
    XLSX.writeFile(workbook, "DanhSachHocVien.xlsx");
  };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Danh sách Học viên</h1>
          <p className="page-subtitle">
            Tổng cộng {students.length} học viên đã đăng ký
          </p>
        </div>
        <div className="students-header-actions" style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div className="students-search">
            <span className="students-search-icon">🔍</span>
            <input
              className="form-input"
              placeholder="Tìm tên, SĐT, mã thẻ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="btn"
            onClick={() => setFilterDebtOnly(!filterDebtOnly)}
            style={{
              border: filterDebtOnly ? "1px solid var(--accent-rose)" : "1px solid var(--border-color)",
              background: filterDebtOnly ? "rgba(244, 63, 94, 0.15)" : "var(--bg-glass)",
              color: filterDebtOnly ? "var(--accent-rose)" : "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            🔴 Chỉ học viên nợ phí
          </button>
          <button className="btn btn-ghost" onClick={exportToExcel} style={{ border: "1px solid var(--border-color)", background: "var(--bg-glass)" }}>
            <span style={{ fontSize: "16px" }}>📤</span> Xuất Excel
          </button>
          <ExcelUploader onImported={fetchData} />
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      ) : (
        <StudentsTable 
          students={filteredStudents} 
          schools={schools}
          packages={packages}
          paymentMethods={paymentMethods}
          onRefresh={fetchData}
          onStudentUpdated={(s) => setStudents(prev => prev.map(item => item.id === s.id ? { ...item, ...s } : item))}
          onStudentDeleted={(id) => setStudents(prev => prev.filter(item => item.id !== id))}
        />
      )}
    </div>
  );
}
