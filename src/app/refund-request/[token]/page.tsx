"use client";

import { useState, useEffect, use } from "react";
import "@/app/globals.css";

interface RequestData {
  id: string;
  status: string;
  registration: {
    amount_paid: number;
    student: { full_name: string };
    package: { package_name: string };
  };
}

export default function RefundRequestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<RequestData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    parent_name: "",
    relation: "",
    phone: "",
    reason: "",
    bank_name: "",
    bank_account: "",
    bank_owner: "",
    agreed: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/refund-requests/public/${token}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Không thể tải dữ liệu");
        }
        const result = await res.json();
        if (result.status !== "pending_info") {
          throw new Error("Yêu cầu này đã được gửi thông tin trước đó.");
        }
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreed) {
      alert("Vui lòng xác nhận cam kết trước khi gửi.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/refund-requests/public/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Có lỗi xảy ra, vui lòng thử lại.");
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        backgroundImage: 'var(--gradient-glow)',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center'
      }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Đang tải...</div>
      </div>
    );
  }

  // Error State
  if (error && !data) {
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
        <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '32px 40px', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            margin: '0 auto 16px',
          }}>
            ⚠️
          </div>
          <h2 className="page-title" style={{ fontSize: '20px', marginBottom: '8px' }}>Lỗi truy cập</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{error}</p>
        </div>
      </div>
    );
  }

  // Success State
  if (success) {
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
        <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '32px 40px', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'var(--gradient-success)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            margin: '0 auto 16px',
            boxShadow: 'var(--shadow-glow-emerald)'
          }}>
            ✅
          </div>
          <h2 className="page-title" style={{ fontSize: '20px', marginBottom: '8px' }}>Gửi yêu cầu thành công</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
            Cảm ơn Quý phụ huynh. Yêu cầu hủy đăng ký và hoàn tiền đã được gửi tới bộ phận Kế toán để xác thực thông tin. Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.
          </p>
        </div>
      </div>
    );
  }

  // Already Processed State
  if (data?.status && data.status !== 'pending_info') {
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
        <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '32px 40px', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            margin: '0 auto 16px',
            border: '1px solid var(--border-color)'
          }}>
            🔒
          </div>
          <h2 className="page-title" style={{ fontSize: '20px', marginBottom: '8px' }}>Liên kết không khả dụng</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
            Yêu cầu hủy đăng ký này đã được gửi và đang trong quá trình xử lý, hoặc đã hoàn tất. Bạn không thể chỉnh sửa thông tin lúc này.
          </p>
        </div>
      </div>
    );
  }

  // Main Form
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '40px 20px',
      background: 'var(--bg-primary)',
      backgroundImage: 'var(--gradient-glow)',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center center'
    }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '0', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          background: 'var(--gradient-warm)',
          padding: '24px 32px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            margin: '0 auto 12px',
            backdropFilter: 'blur(10px)',
          }}>
            📝
          </div>
          <p style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginBottom: '4px', letterSpacing: '0.5px' }}>LIÊN ĐOÀN THỂ THAO DƯỚI NƯỚC TP.HCM</p>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>PHIẾU YÊU CẦU HỦY ĐĂNG KÝ KHÓA HÈ</h2>
        </div>

        <div style={{ padding: '24px 32px 32px' }}>
          {/* Info Card */}
          <div style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: '24px',
          }}>
            <div style={{ fontSize: '12px', color: 'var(--accent-indigo-light)', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Thông tin đăng ký
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'inline-block', width: '120px' }}>Học viên:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{data?.registration.student.full_name}</strong>
              </div>
              <div style={{ fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'inline-block', width: '120px' }}>Gói học:</span>
                <span style={{ color: 'var(--text-secondary)' }}>{data?.registration.package.package_name}</span>
              </div>
              <div style={{ fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'inline-block', width: '120px' }}>Tổng tiền đã đóng:</span>
                <strong style={{ color: 'var(--accent-emerald-light)' }}>{data?.registration.amount_paid.toLocaleString()} đ</strong>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
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
              }}>
                {error}
              </div>
            )}

            {/* Thông tin người yêu cầu */}
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Thông tin người yêu cầu
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="parent_name">Họ và tên Phụ huynh / Người giám hộ<span style={{ color: "var(--accent-rose)" }}> *</span></label>
              <input required type="text" id="parent_name" name="parent_name" value={formData.parent_name} onChange={handleChange} className="form-input" placeholder="VD: Nguyễn Văn A" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="relation">Mối quan hệ<span style={{ color: "var(--accent-rose)" }}> *</span></label>
                <select required id="relation" name="relation" value={formData.relation} onChange={handleChange} className="form-input">
                  <option value="">Chọn...</option>
                  <option value="Bố">Bố</option>
                  <option value="Mẹ">Mẹ</option>
                  <option value="Người giám hộ">Người giám hộ</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="phone">Số điện thoại<span style={{ color: "var(--accent-rose)" }}> *</span></label>
                <input required type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className="form-input" placeholder="0901 234 567" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reason">Lý do hủy khóa học<span style={{ color: "var(--accent-rose)" }}> *</span></label>
              <textarea required id="reason" name="reason" value={formData.reason} onChange={handleChange} rows={2} className="form-input" placeholder="Nhập lý do..." style={{ resize: 'vertical' }}></textarea>
            </div>

            {/* Thông tin ngân hàng */}
            <div style={{ borderTop: '1px solid var(--border-color)', margin: '20px 0', paddingTop: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Thông tin tài khoản nhận tiền hoàn
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bank_name">Tên Ngân hàng<span style={{ color: "var(--accent-rose)" }}> *</span></label>
                <input required type="text" id="bank_name" name="bank_name" value={formData.bank_name} onChange={handleChange} className="form-input" placeholder="VD: Vietcombank, Techcombank..." />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bank_account">Số tài khoản<span style={{ color: "var(--accent-rose)" }}> *</span></label>
                <input required type="text" id="bank_account" name="bank_account" value={formData.bank_account} onChange={handleChange} className="form-input" placeholder="VD: 1234567890" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bank_owner">Tên chủ tài khoản<span style={{ color: "var(--accent-rose)" }}> *</span></label>
                <input required type="text" id="bank_owner" name="bank_owner" value={formData.bank_owner} onChange={handleChange} className="form-input" placeholder="Phải khớp với tên Phụ huynh" style={{ textTransform: 'uppercase' }} />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  ⚠️ Tên chủ tài khoản phải trùng khớp với tên Phụ huynh / Người giám hộ.
                </p>
              </div>
            </div>

            {/* Checkbox cam kết */}
            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              marginBottom: '24px',
            }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input
                  required
                  type="checkbox"
                  name="agreed"
                  checked={formData.agreed}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--accent-indigo)', flexShrink: 0 }}
                />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Tôi xác nhận là người giám hộ hợp pháp của học viên. Tôi đồng ý với số tiền hoàn lại và xác nhận việc hủy đăng ký khóa học này. Tôi xin chịu hoàn toàn trách nhiệm trước pháp luật về các thông tin đã cung cấp.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '14px',
                background: 'var(--gradient-warm)',
                fontSize: '15px',
              }}
            >
              {submitting ? "Đang xử lý..." : "Gửi yêu cầu hoàn tiền"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
