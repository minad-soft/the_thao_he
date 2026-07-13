"use client";

import { useState, useEffect } from "react";
import "@/app/globals.css";

interface RefundRequest {
  id: string;
  registration_id: string;
  token: string;
  parent_name: string;
  phone: string;
  reason: string;
  bank_name: string;
  bank_account: string;
  bank_owner: string;
  status: string;
  created_at: string;
  registration: {
    amount_paid: number;
    student: { full_name: string };
    package: { package_name: string };
  };
  creator?: { full_name: string };
  accountant?: { full_name: string };
  manager?: { full_name: string };
}

export default function RefundRequestsAdminPage() {
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploadModal, setUploadModal] = useState<{
    isOpen: boolean;
    requestId: string | null;
    isUploading: boolean;
  }>({ isOpen: false, requestId: null, isUploading: false });

  const compressImageToMax100Kb = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          let quality = 0.7;
          let dataUrl = canvas.toDataURL("image/jpeg", quality);
          while (dataUrl.length > 137000 && quality > 0.1) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          }
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const getNotifyMessage = (req: RefundRequest) => {
    return `Trung tâm đã hoàn tất thủ tục hủy khóa học và hoàn tiền cho học viên ${req.registration?.student?.full_name || ""}.\nSố tiền hoàn: ${req.registration?.amount_paid?.toLocaleString() || 0} VNĐ.\nVui lòng kiểm tra tài khoản ngân hàng. Cảm ơn anh/chị.`;
  };

  const handleCopyNotify = (req: RefundRequest) => {
    navigator.clipboard.writeText(getNotifyMessage(req));
    setCopiedId(req.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/refund-requests");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRequests(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: string, currentStatus: string) => {
    let newStatus = "";
    if (currentStatus === "pending_accountant") newStatus = "pending_manager";
    else if (currentStatus === "pending_manager") newStatus = "pending_payment";
    else if (currentStatus === "pending_payment") {
      setUploadModal({ isOpen: true, requestId: id, isUploading: false });
      return;
    }

    if (newStatus && confirm("Xác nhận duyệt yêu cầu này?")) {
      try {
        const res = await fetch(`/api/refund-requests/admin/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus })
        });
        if (!res.ok) {
          const errData = await res.json();
          alert(errData.error || "Có lỗi xảy ra");
          return;
        }
        fetchRequests();
      } catch (err) {
        alert("Có lỗi xảy ra");
      }
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending_info": return <span className="badge badge-slate">Chờ KH điền form</span>;
      case "pending_accountant": return <span className="badge badge-amber">Kế toán xác minh</span>;
      case "pending_manager": return <span className="badge badge-rose">Chờ QL duyệt</span>;
      case "pending_payment": return <span className="badge badge-indigo">Chờ chuyển tiền</span>;
      case "completed": return <span className="badge badge-emerald">Hoàn tất</span>;
      case "rejected": return <span className="badge badge-rose">Từ chối</span>;
      default: return <span className="badge badge-slate">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "32px", color: "var(--text-muted)", textAlign: "center" }}>
        Đang tải dữ liệu...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "32px", color: "var(--accent-rose)", textAlign: "center" }}>
        Lỗi: {error}
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 className="page-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            justifyContent: "center", 
            width: "40px", 
            height: "40px", 
            borderRadius: "10px", 
            background: "var(--gradient-primary)",
            boxShadow: "var(--shadow-glow-indigo)"
          }}>
            💸
          </span>
          Quản lý Yêu cầu Hoàn tiền
        </h1>
      </div>

      <div className="card" style={{ padding: "0" }}>
        <div style={{ maxHeight: "calc(100vh - 250px)", overflow: "auto" }}>
          <table className="data-table">
            <thead style={{ position: "sticky", top: 0, zIndex: 20, background: "var(--bg-secondary)" }}>
              <tr>
                <th style={{ width: "22%" }}>Học viên / Gói</th>
                <th style={{ width: "20%" }}>Thông tin Phụ huynh</th>
                <th style={{ width: "22%" }}>Thông Ngân hàng</th>
                <th style={{ width: "12%" }}>Trạng thái</th>
                <th style={{ width: "12%" }}>Ngày tạo</th>
                <th style={{ width: "12%" }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td data-label="Học viên">
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{req.registration?.student?.full_name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                      {req.registration?.package?.package_name} 
                      <span style={{ color: "var(--accent-emerald-light)", marginLeft: "8px" }}>
                        ({req.registration?.amount_paid?.toLocaleString()} đ)
                      </span>
                    </div>
                  </td>
                  <td data-label="Phụ huynh">
                    <div style={{ color: "var(--text-primary)" }}>{req.parent_name || "—"}</div>
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{req.phone || "—"}</div>
                    {req.reason && (
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic", marginTop: "4px" }}>
                        Lý do: {req.reason}
                      </div>
                    )}
                  </td>
                  <td data-label="Ngân hàng">
                    {req.bank_owner ? (
                      <>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", textTransform: "uppercase" }}>{req.bank_owner}</div>
                        <div style={{ fontSize: "13px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ color: "var(--accent-indigo-light)", fontWeight: 500 }}>{req.bank_name}</span>
                          <span>-</span>
                          <span>{req.bank_account}</span>
                        </div>
                      </>
                    ) : "—"}
                  </td>
                  <td data-label="Trạng thái">
                    {getStatusLabel(req.status)}
                  </td>
                  <td data-label="Ngày tạo" style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    {new Date(req.created_at).toLocaleString("vi-VN", { 
                      day: "2-digit", month: "2-digit", year: "numeric", 
                      hour: "2-digit", minute: "2-digit" 
                    })}
                  </td>
                  <td data-label="Hành động">
                    {req.status === "pending_accountant" && (
                      <button onClick={() => handleApprove(req.id, req.status)} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "13px", color: "var(--accent-amber)" }}>
                        Xác minh đúng tên
                      </button>
                    )}
                    {req.status === "pending_manager" && (
                      <button onClick={() => handleApprove(req.id, req.status)} className="btn btn-primary" style={{ padding: "6px 12px", fontSize: "13px", background: "var(--accent-rose)", borderColor: "var(--accent-rose)" }}>
                        Duyệt lệnh
                      </button>
                    )}
                    {req.status === "pending_payment" && (
                      <button onClick={() => handleApprove(req.id, req.status)} className="btn btn-primary" style={{ padding: "6px 12px", fontSize: "13px" }}>
                        Xác nhận Đã CK
                      </button>
                    )}
                    {req.status === "completed" && (
                      <button
                        onClick={() => handleCopyNotify(req)}
                        className="btn"
                        style={{
                          padding: "6px 12px",
                          fontSize: "13px",
                          background: copiedId === req.id ? "rgba(16, 185, 129, 0.2)" : "rgba(99, 102, 241, 0.1)",
                          color: copiedId === req.id ? "var(--accent-emerald)" : "var(--accent-indigo-light)",
                          border: `1px solid ${copiedId === req.id ? "rgba(16, 185, 129, 0.4)" : "rgba(99, 102, 241, 0.3)"}`
                        }}
                      >
                        {copiedId === req.id ? "✅ Đã copy" : "📋 Copy Zalo"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              
              {requests.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    Không có yêu cầu hoàn tiền nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {uploadModal.isOpen && (
        <div className="modal-backdrop" style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(4px)"
        }}>
          <div className="modal-content" style={{ 
            background: "var(--bg-card)", 
            padding: "24px", 
            borderRadius: "12px", 
            width: "100%", 
            maxWidth: "400px",
            border: "1px solid var(--border-color)",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)"
          }}>
            <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "16px", color: "var(--text-primary)" }}>Xác nhận Đã chuyển khoản</h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px", lineHeight: "1.5" }}>
              Vui lòng tải lên hình ảnh biên lai chuyển khoản để hoàn tất thủ tục hoàn tiền và hủy khóa học.
            </p>
            
            <div style={{ marginBottom: "24px" }}>
              <input 
                type="file" 
                accept="image/*"
                id="receipt-upload"
                style={{ display: "none" }}
                disabled={uploadModal.isUploading}
                onChange={async (e) => {
                   const file = e.target.files?.[0];
                   if (!file) return;
                   try {
                     setUploadModal(prev => ({ ...prev, isUploading: true }));
                     const compressedBase64 = await compressImageToMax100Kb(file);
                     
                     const res = await fetch(`/api/refund-requests/admin/${uploadModal.requestId}`, {
                       method: "PUT",
                       headers: { "Content-Type": "application/json" },
                       body: JSON.stringify({ status: "completed", receipt_image: compressedBase64 })
                     });
                     
                     if (!res.ok) {
                       const errData = await res.json();
                       alert(errData.error || "Có lỗi xảy ra");
                       setUploadModal(prev => ({ ...prev, isUploading: false }));
                       return;
                     }
                     
                     alert("Đã hoàn tất hoàn tiền và hủy khóa học!");
                     setUploadModal({ isOpen: false, requestId: null, isUploading: false });
                     fetchRequests();
                   } catch (err) {
                     alert("Lỗi tải ảnh. Vui lòng thử lại.");
                     setUploadModal(prev => ({ ...prev, isUploading: false }));
                   }
                }}
              />
              <label 
                htmlFor="receipt-upload" 
                className="btn" 
                style={{ 
                  display: "flex", 
                  justifyContent: "center", 
                  width: "100%", 
                  padding: "16px", 
                  border: "2px dashed var(--accent-indigo)",
                  background: "rgba(99, 102, 241, 0.05)",
                  color: "var(--accent-indigo-light)",
                  cursor: uploadModal.isUploading ? "not-allowed" : "pointer",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s"
                }}
              >
                {uploadModal.isUploading ? "Đang xử lý tải ảnh..." : "📸 Bấm vào đây để tải ảnh lên"}
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setUploadModal({ isOpen: false, requestId: null, isUploading: false })}
                disabled={uploadModal.isUploading}
                style={{ padding: "8px 24px" }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
