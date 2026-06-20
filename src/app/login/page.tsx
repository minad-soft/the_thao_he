"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "./login.css";

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    // Hiển thị thông báo nếu bị Middleware chuyển hướng vì chưa đăng nhập hoặc không đủ quyền
    const errorParam = searchParams.get("error");
    if (errorParam === "unauthorized") {
      setError("Bạn không có quyền truy cập vào chức năng này.");
    } else if (errorParam === "session_expired") {
      setError("Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Tên đăng nhập hoặc mật khẩu không đúng.");
        setLoading(false);
        return;
      }

      // Đăng nhập thành công, reload và redirect về trang chủ để render lại toàn bộ layout & Sidebar
      window.location.href = "/";
    } catch (err) {
      console.error("Login failed:", err);
      setError("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="login-error-alert">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      <div className="form-group">
        <label className="form-label" htmlFor="username">Tên đăng nhập</label>
        <input
          type="text"
          id="username"
          className="login-input"
          placeholder="Nhập tên đăng nhập của bạn..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
          autoComplete="username"
          required
        />
      </div>

      <div className="form-group" style={{ marginBottom: "24px" }}>
        <label className="form-label" htmlFor="password">Mật khẩu</label>
        <div className="password-input-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            className="login-input"
            placeholder="Nhập mật khẩu..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            disabled={loading}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            )}
          </button>
        </div>
      </div>

      <button type="submit" className="login-btn" disabled={loading}>
        {loading ? <div className="login-spinner"></div> : "Đăng nhập hệ thống"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="login-container">
      <div className="login-bg-shape-1"></div>
      <div className="login-bg-shape-2"></div>

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🏊</div>
          <h1 className="login-title">THỂ THAO HÈ 2026</h1>
          <p className="login-subtitle">Hệ thống Quản lý khóa học & Vận hành</p>
        </div>

        <Suspense fallback={<div className="loading-spinner"><div className="spinner"></div></div>}>
          <LoginForm />
        </Suspense>

        <div className="login-footer">
          Được thiết kế cho ban quản lý khóa học hè
        </div>
      </div>
    </div>
  );
}
