"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "@/app/globals.css"; // Ensure globals are loaded

export default function StudentLoginPage() {
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/student-portal/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, dob }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Đăng nhập thất bại");
      }

      router.push("/dang-ky-mon/chon-mon");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px',
      background: 'var(--bg-primary)',
      backgroundImage: 'var(--gradient-glow)',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center center'
    }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '32px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'var(--gradient-primary)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            margin: '0 auto 16px',
            boxShadow: 'var(--shadow-glow-indigo)'
          }}>
            🎓
          </div>
          <h2 className="page-title" style={{ fontSize: '24px', marginBottom: '8px' }}>
            Cổng Học Viên
          </h2>
          <p className="page-subtitle">Đăng nhập để chọn môn học mùa hè</p>
        </div>

        <form onSubmit={handleLogin}>
          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              color: 'var(--accent-rose)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '20px',
              fontSize: '14px',
              fontWeight: 500,
              whiteSpace: 'pre-line'
            }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Họ và Tên</label>
            <input
              id="fullName"
              type="text"
              required
              placeholder="VD: NGUYỄN MẠNH KHANG"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="form-input"
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="dob">Mật khẩu (Ngày sinh)</label>
            <input
              id="dob"
              type="text"
              required
              placeholder="DDMMYYYY (VD: 02052011)"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="form-input"
            />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Nhập 8 chữ số ngày tháng năm sinh.
            </p>
          </div>

          <div style={{ marginTop: '32px' }}>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            >
              {isLoading ? "Đang xử lý..." : "Đăng nhập hệ thống"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
