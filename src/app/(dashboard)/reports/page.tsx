"use client";

import { useState, useEffect } from "react";
import StatCards from "@/modules/reports/StatCards";
import RevenueChart from "@/modules/reports/RevenueChart";
import CheckinChart from "@/modules/reports/CheckinChart";
import "./reports.css";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch("/api/reports");
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) {
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

      <StatCards stats={data.stats} />

      <div className="reports-charts">
        <RevenueChart data={data.revenueData} />
        <CheckinChart data={data.checkinData} />
      </div>
    </div>
  );
}
