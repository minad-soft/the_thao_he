"use client";

import { useState, useEffect } from "react";
import StatCards from "@/modules/reports/StatCards";
import RevenueChart from "@/modules/reports/RevenueChart";
import CheckinChart from "@/modules/reports/CheckinChart";
import RevenueBySchoolChart from "@/modules/reports/RevenueBySchoolChart";
import FilteredListTable from "@/modules/reports/FilteredListTable";
import ShiftStatistics from "@/modules/reports/ShiftStatistics";
import "./reports.css";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  
  // Default to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const defaultStart = firstDay.toISOString().split("T")[0];
  const defaultEnd = today.toISOString().split("T")[0];

  const [page, setPage] = useState(1);
  const limit = 25;

  const [activeTab, setActiveTab] = useState<'revenue' | 'checkin' | 'classes'>('revenue');

  const [filters, setFilters] = useState({
    startDate: defaultStart,
    endDate: defaultEnd,
    schoolId: "",
    paymentMethodId: "",
  });

  const fetchReports = async (currentFilters: typeof filters, currentPage: number = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString()
      });
      if (currentFilters.startDate) queryParams.append("startDate", currentFilters.startDate);
      if (currentFilters.endDate) queryParams.append("endDate", currentFilters.endDate);
      if (currentFilters.schoolId) queryParams.append("schoolId", currentFilters.schoolId);
      if (currentFilters.paymentMethodId) queryParams.append("paymentMethodId", currentFilters.paymentMethodId);

      const res = await fetch(`/api/reports?${queryParams.toString()}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const [schoolsRes, methodsRes] = await Promise.all([
        fetch("/api/schools"),
        fetch("/api/payment-methods")
      ]);
      if (schoolsRes.ok) setSchools(await schoolsRes.json());
      if (methodsRes.ok) setPaymentMethods(await methodsRes.json());
    } catch (err) {
      console.error("Failed to fetch filter options:", err);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
    fetchReports(filters, page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReports(filters, 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchReports(filters, newPage);
  };

  const handleExportExcel = async () => {
    try {
      const queryParams = new URLSearchParams({
        export: "true"
      });
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);
      if (filters.schoolId) queryParams.append("schoolId", filters.schoolId);
      if (filters.paymentMethodId) queryParams.append("paymentMethodId", filters.paymentMethodId);

      const res = await fetch(`/api/reports?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch export data");
      
      const result = await res.json();
      const allListData = result.listData;

      if (!allListData || allListData.length === 0) {
        alert("Không có dữ liệu để xuất!");
        return;
      }

      const { utils, writeFile } = await import("xlsx");
      const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
          day: "2-digit", month: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit"
        });
      };

      const exportData = allListData.map((row: any, index: number) => ({
        "STT": index + 1,
        "Tên học viên": row.studentName,
        "Trường học": row.schoolName,
        "Gói học": row.packageName,
        "Hình thức thanh toán": row.paymentMethod,
        "Số tiền (VNĐ)": row.amount,
        "Ngày đăng ký": formatDate(row.createdAt),
      }));

      const worksheet = utils.json_to_sheet(exportData);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "DanhSachGiaoDich");

      const wscols = [
        { wch: 5 }, { wch: 25 }, { wch: 35 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 20 }
      ];
      worksheet["!cols"] = wscols;

      writeFile(workbook, `BaoCaoGiaoDich_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error("Export Error:", err);
      alert("Lỗi khi xuất dữ liệu.");
    }
  };

  if (!data && loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="form-error">Lỗi tải dữ liệu báo cáo</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Báo cáo Thống kê</h1>
        <p className="page-subtitle">Dashboard tổng quan hoạt động dự án Summer Sports</p>
      </div>

      <div className="tabs" style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
        <button 
          className={`tab-btn ${activeTab === 'revenue' ? 'active' : ''}`}
          onClick={() => setActiveTab('revenue')}
          style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'revenue' ? '2px solid var(--accent-indigo)' : '2px solid transparent', color: activeTab === 'revenue' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '15px', transition: 'all 0.2s' }}
        >
          💰 Báo cáo Doanh thu
        </button>
        <button 
          className={`tab-btn ${activeTab === 'checkin' ? 'active' : ''}`}
          onClick={() => setActiveTab('checkin')}
          style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'checkin' ? '2px solid var(--accent-indigo)' : '2px solid transparent', color: activeTab === 'checkin' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '15px', transition: 'all 0.2s' }}
        >
          🎫 Báo cáo Check-in
        </button>
        <button 
          className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => setActiveTab('classes')}
          style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'classes' ? '2px solid var(--accent-indigo)' : '2px solid transparent', color: activeTab === 'classes' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '15px', transition: 'all 0.2s' }}
        >
          📈 Báo cáo Lớp học
        </button>
      </div>

      <div style={{ display: activeTab === 'revenue' ? 'block' : 'none' }}>
        {/* Filter Form always visible */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-body" style={{ padding: "16px" }}>
            <form onSubmit={handleFilterSubmit} style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: "150px" }}>
                <label className="form-label">Từ ngày</label>
                <input
                  type="date"
                  className="form-input"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: "150px" }}>
                <label className="form-label">Đến ngày</label>
                <input
                  type="date"
                  className="form-input"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: "200px" }}>
                <label className="form-label">Trường học</label>
                <select
                  className="form-select"
                  value={filters.schoolId}
                  onChange={(e) => setFilters({ ...filters, schoolId: e.target.value })}
                >
                  <option value="">-- Tất cả trường --</option>
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.school_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: "200px" }}>
                <label className="form-label">Hình thức TT</label>
                <select
                  className="form-select"
                  value={filters.paymentMethodId}
                  onChange={(e) => setFilters({ ...filters, paymentMethodId: e.target.value })}
                >
                  <option value="">-- Tất cả --</option>
                  {paymentMethods.map(pm => (
                    <option key={pm.id} value={pm.id}>{pm.method_name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: "42px" }} disabled={loading}>
                {loading ? "Đang lọc..." : "Lọc dữ liệu"}
              </button>
            </form>
          </div>
        </div>

        <StatCards stats={data.stats} />

        <div className="reports-charts" style={{ marginTop: "24px" }}>
          <RevenueBySchoolChart data={data.revenueBySchoolData} />
          <RevenueChart data={data.revenueData} />
        </div>

        <FilteredListTable 
          data={data.listData} 
          page={page}
          totalCount={data.totalListCount}
          limit={limit}
          onPageChange={handlePageChange}
          onExport={handleExportExcel}
        />
      </div>

      <div style={{ display: activeTab === 'checkin' ? 'block' : 'none' }}>
        <CheckinChart data={data.checkinData} />
      </div>

      <div style={{ display: activeTab === 'classes' ? 'block' : 'none' }}>
        <ShiftStatistics />
      </div>
    </div>
  );
}
