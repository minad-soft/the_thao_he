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

  // Filter theo search
  const filteredStudents = students.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const matchName = s.full_name?.toLowerCase().includes(term);
    const matchPhone = s.phone_number?.toLowerCase().includes(term);
    const matchCode = s.registrations?.[0]?.card_code?.toLowerCase().includes(term);
    return matchName || matchPhone || matchCode;
  });

  const exportToExcel = () => {
    if (students.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    const dataToExport = filteredStudents.map((s, index) => {
      const reg = s.registrations?.[0];
      return {
        "STT": index + 1,
        "Họ tên": s.full_name,
        "Ngày sinh": s.dob ? new Date(s.dob).toLocaleDateString("vi-VN") : "",
        "Lớp": s.class_name || "",
        "Số điện thoại": s.phone_number || "",
        "Trường": s.schools ? s.schools.school_name : s.other_school_name || "",
        "Ghi chú": s.notes || "",
        "Mã thẻ": reg?.card_code || "",
        "Gói học": reg?.pricing_packages?.package_name || "",
        "Giá (VNĐ)": reg?.pricing_packages?.price || "",
        "Số buổi": reg?.remaining_sessions || "",
        "Số phiếu thu": reg?.receipt_number || "",
        "Hình thức thanh toán": reg?.payment_methods?.method_name || "",
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
        <div className="students-header-actions">
          <div className="students-search">
            <span className="students-search-icon">🔍</span>
            <input
              className="form-input"
              placeholder="Tìm tên, SĐT, mã thẻ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
