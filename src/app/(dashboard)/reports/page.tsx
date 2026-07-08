"use client";

import { useState, useEffect } from "react";
import StatCards from "@/modules/reports/StatCards";
import RevenueChart from "@/modules/reports/RevenueChart";
import CheckinChart from "@/modules/reports/CheckinChart";
import RevenueBySchoolChart from "@/modules/reports/RevenueBySchoolChart";
import FilteredListTable from "@/modules/reports/FilteredListTable";
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

  const [filters, setFilters] = useState({
    startDate: defaultStart,
    endDate: defaultEnd,
    schoolId: "",
    paymentMethodId: "",
  });

  const fetchReports = async (currentFilters: typeof filters) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
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
        fetch("/api/settings/payment-methods")
      ]);
      if (schoolsRes.ok) setSchools(await schoolsRes.json());
      if (methodsRes.ok) setPaymentMethods(await methodsRes.json());
    } catch (err) {
      console.error("Failed to fetch filter options:", err);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
    fetchReports(filters);
  }, []); // Run once on mount

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports(filters);
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

      {/* Filter Form */}
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
                className="form-input"
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
                className="form-input"
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

      <div style={{ marginTop: "24px" }}>
        <CheckinChart data={data.checkinData} />
      </div>

      <FilteredListTable data={data.listData} />
    </div>
  );
}
