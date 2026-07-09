"use client";

import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import StudentsTable from "@/modules/students/StudentsTable";
import ExcelUploader from "@/modules/students/ExcelUploader";
import { parsePreference } from "@/lib/preference-utils";
import "./students.css";

export default function StudentsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [students, setStudents] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferenceStats, setPreferenceStats] = useState<Record<string, number>>({});
  
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterDebtOnly, setFilterDebtOnly] = useState(false);
  const [activeListFilter, setActiveListFilter] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 25;

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page to 1 when search or filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, filterDebtOnly, activeListFilter]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: debouncedSearchTerm,
        debtOnly: filterDebtOnly.toString(),
        listFilter: activeListFilter || ""
      });

      const [studentsRes, schoolsRes, packagesRes, paymentMethodsRes] = await Promise.all([
        fetch(`/api/students?${queryParams.toString()}`),
        fetch("/api/schools"),
        fetch("/api/pricing-packages"),
        fetch("/api/payment-methods")
      ]);

      if (studentsRes.ok) {
        const result = await studentsRes.json();
        setStudents(result.data || []);
        setTotalCount(result.totalCount || 0);
        if (result.preferenceStats) setPreferenceStats(result.preferenceStats);
      }
      if (schoolsRes.ok) setSchools(await schoolsRes.json());
      if (packagesRes.ok) setPackages(await packagesRes.json());
      if (paymentMethodsRes.ok) setPaymentMethods(await paymentMethodsRes.json());
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearchTerm, filterDebtOnly, activeListFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const exportToExcel = async () => {
    try {
      const queryParams = new URLSearchParams({
        search: debouncedSearchTerm,
        debtOnly: filterDebtOnly.toString(),
        listFilter: activeListFilter || "",
        export: "true"
      });
      const res = await fetch(`/api/students?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch export data");
      
      const { data: allStudents } = await res.json();

      if (!allStudents || allStudents.length === 0) {
        alert("Không có dữ liệu để xuất!");
        return;
      }

      const dataToExport = allStudents.map((s: any, index: number) => {
        const reg = s.registrations?.[0];
        const paymentMethodsStr = reg?.registration_payments && reg.registration_payments.length > 0
          ? reg.registration_payments.map((p: any) => `${p.payment_methods?.method_name || "Chưa rõ"}: ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p.amount)}`).join(", ")
          : reg?.payment_methods?.method_name || "";

        const prefs = parsePreference(s.sports_preference);
        
        if (activeListFilter && activeListFilter !== 'DA_CHON' && activeListFilter !== 'CHUA_CHON') {
          const activeSubjects = [
             prefs.onBoi ? "Ôn bơi" : null,
             prefs.hocBoi ? "Học bơi" : null,
             prefs.bongRo ? "Bóng rổ" : null,
             prefs.cauLong ? "Cầu lông" : null
          ].filter(Boolean).join(", ");
          
          return {
            "STT": index + 1,
            "HỌ VÀ TÊN": s.full_name,
            "SỐ ĐIỆN THOẠI": s.phone_number || "",
            "TRƯỜNG": s.schools ? s.schools.school_name : s.other_school_name || "",
            "MÃ THẺ": reg?.card_code || "",
            "MÔN": activeSubjects
          };
        }

        return {
          "STT": index + 1,
          "Họ tên": s.full_name,
          "Ngày sinh": s.dob ? new Date(s.dob).toLocaleDateString("vi-VN") : "",
          "Giới tính": s.gender || "",
          "Lớp": s.class_name || "",
          "Số điện thoại": s.phone_number || "",
          "Trường": s.schools ? s.schools.school_name : s.other_school_name || "",
          "Ghi chú": s.notes || "",
          "Trạng thái NV": prefs.hasPreference ? "Đã chọn" : "Chưa chọn",
          "Ôn bơi": prefs.onBoi ? "✓" : "",
          "Học bơi": prefs.hocBoi ? "✓" : "",
          "Bóng rổ": prefs.bongRo ? "✓" : "",
          "Cầu lông": prefs.cauLong ? "✓" : "",
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
      XLSX.writeFile(workbook, `DanhSachHocVien_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error("Export Error:", err);
      alert("Đã xảy ra lỗi khi xuất file Excel.");
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 className="page-title">Danh sách Học viên</h1>
          <p className="page-subtitle">
            Tổng cộng {totalCount} học viên đã đăng ký
          </p>
          {Object.keys(preferenceStats).length > 0 && (
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "12px" }}>
              {Object.entries(preferenceStats).map(([pref, count]) => (
                <span key={pref} className="badge badge-emerald" style={{ padding: "8px 12px", fontSize: "13px" }}>
                  {pref}: <strong>{count}</strong>
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ flexBasis: "100%", margin: "8px 0" }}>
          <div style={{ background: "var(--bg-glass)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <strong style={{ fontSize: "14px", color: "var(--text-secondary)" }}>LỌC DANH SÁCH LỚP:</strong>
            <button 
              className={`btn btn-sm ${activeListFilter === 'TEST_BOI' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveListFilter(activeListFilter === 'TEST_BOI' ? null : 'TEST_BOI')}
              style={{ border: activeListFilter === 'TEST_BOI' ? 'none' : '1px solid var(--border-color)' }}
            >
              🏊 DANH SÁCH KIỂM TRA BƠI
            </button>
            <button 
              className={`btn btn-sm ${activeListFilter === 'HOC_BOI' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveListFilter(activeListFilter === 'HOC_BOI' ? null : 'HOC_BOI')}
              style={{ border: activeListFilter === 'HOC_BOI' ? 'none' : '1px solid var(--border-color)' }}
            >
              🏊 DANH SÁCH HỌC BƠI
            </button>
            <button 
              className={`btn btn-sm ${activeListFilter === 'BONG_RO' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveListFilter(activeListFilter === 'BONG_RO' ? null : 'BONG_RO')}
              style={{ border: activeListFilter === 'BONG_RO' ? 'none' : '1px solid var(--border-color)' }}
            >
              🏀 DANH SÁCH BÓNG RỔ
            </button>
            <button 
              className={`btn btn-sm ${activeListFilter === 'CAU_LONG' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveListFilter(activeListFilter === 'CAU_LONG' ? null : 'CAU_LONG')}
              style={{ border: activeListFilter === 'CAU_LONG' ? 'none' : '1px solid var(--border-color)' }}
            >
              🏸 DANH SÁCH CẦU LÔNG
            </button>
            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 8px' }}></div>
            <button 
              className={`btn btn-sm ${activeListFilter === 'DA_CHON' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveListFilter(activeListFilter === 'DA_CHON' ? null : 'DA_CHON')}
              style={{ border: activeListFilter === 'DA_CHON' ? 'none' : '1px solid var(--border-color)', color: 'var(--accent-emerald)' }}
            >
              ✓ ĐÃ CHỌN NV
            </button>
            <button 
              className={`btn btn-sm ${activeListFilter === 'CHUA_CHON' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveListFilter(activeListFilter === 'CHUA_CHON' ? null : 'CHUA_CHON')}
              style={{ border: activeListFilter === 'CHUA_CHON' ? 'none' : '1px solid var(--border-color)', color: 'var(--accent-rose)' }}
            >
              ✗ CHƯA CHỌN NV
            </button>
          </div>
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
          <ExcelUploader onImported={() => { setPage(1); fetchData(); }} />
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      ) : (
        <StudentsTable 
          students={students} 
          schools={schools}
          packages={packages}
          paymentMethods={paymentMethods}
          onRefresh={fetchData}
          onStudentUpdated={(s) => setStudents(prev => prev.map(item => item.id === s.id ? { ...item, ...s } : item))}
          onStudentDeleted={(id) => setStudents(prev => prev.filter(item => item.id !== id))}
          page={page}
          totalCount={totalCount}
          limit={limit}
          onPageChange={setPage}
          activeFilter={activeListFilter}
        />
      )}
    </div>
  );
}
