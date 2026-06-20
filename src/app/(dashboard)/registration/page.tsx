"use client";

import { useState, useEffect, useCallback } from "react";
import RegistrationForm from "@/modules/registration/RegistrationForm";
import "./registration.css";

interface RegistrationRecord {
  id: string;
  card_code: string;
  status: string;
  remaining_sessions: number;
  created_at: string;
  students: { full_name: string } | null;
  pricing_packages: { package_name: string; subject: string } | null;
}

export default function RegistrationPage() {
  const [recentRegistrations, setRecentRegistrations] = useState<RegistrationRecord[]>([]);

  const fetchRecent = useCallback(async () => {
    const res = await fetch("/api/registrations");
    if (res.ok) {
      const data = await res.json();
      setRecentRegistrations(data.slice(0, 10)); // Show 10 gần nhất
    }
  }, []);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Ghi danh học viên</h1>
        <p className="page-subtitle">Đăng ký học viên mới — Mã thẻ được sinh tự động</p>
      </div>

      <div className="registration-grid">
        {/* Form ghi danh */}
        <RegistrationForm onRegistered={fetchRecent} />

        {/* Danh sách ghi danh gần đây */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🕐 Ghi danh gần đây</h3>
          </div>
          <div className="card-body recent-list">
            {recentRegistrations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <div className="empty-state-text">Chưa có ghi danh nào</div>
              </div>
            ) : (
              recentRegistrations.map((reg) => (
                <div key={reg.id} className="recent-item">
                  <span className="recent-code">{reg.card_code}</span>
                  <div className="recent-info">
                    <div className="recent-name">{reg.students?.full_name}</div>
                    <div className="recent-package">
                      {reg.pricing_packages?.package_name} · {reg.pricing_packages?.subject}
                    </div>
                  </div>
                  <span className="recent-sessions">{reg.remaining_sessions} buổi</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
