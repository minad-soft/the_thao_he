"use client";

interface QRTicketProps {
  ticketCode: string;
  studentName: string;
  packageName: string;
  subject: string;
  sessionsBefore: number;
  sessionsAfter: number;
  checkedInAt: string;
  printTicket?: boolean;
}

/**
 * QRTicket — Hiển thị mã vé cổng sau check-in thành công.
 * Mã vé sẽ được dùng để trigger máy in nhiệt (tuân thủ DESIGN.md mục C).
 */
export default function QRTicket({
  ticketCode,
  studentName,
  packageName,
  subject,
  sessionsBefore,
  sessionsAfter,
  checkedInAt,
  printTicket,
}: QRTicketProps) {
  const time = new Date(checkedInAt).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="qr-ticket">
      <div className="qr-ticket-header">
        <span className="qr-ticket-check">✅</span>
        <span className="qr-ticket-title">CHECK-IN THÀNH CÔNG</span>
      </div>

      <div className="qr-ticket-code-wrapper">
        <div className="qr-ticket-code">{ticketCode}</div>
        <div className="qr-ticket-code-label">Mã vé cổng</div>
      </div>

      <div className="qr-ticket-info">
        <div className="qr-ticket-row">
          <span className="qr-ticket-label">Học viên</span>
          <span className="qr-ticket-value">{studentName}</span>
        </div>
        <div className="qr-ticket-row">
          <span className="qr-ticket-label">Gói học</span>
          <span className="qr-ticket-value">{packageName}</span>
        </div>
        <div className="qr-ticket-row">
          <span className="qr-ticket-label">Môn</span>
          <span className="qr-ticket-value">
            <span className="badge badge-cyan">{subject}</span>
          </span>
        </div>
        <div className="qr-ticket-row">
          <span className="qr-ticket-label">Buổi</span>
          <span className="qr-ticket-value">
            <span style={{ textDecoration: "line-through", color: "var(--text-muted)" }}>
              {sessionsBefore}
            </span>
            {" → "}
            <span style={{ fontWeight: 700, color: sessionsAfter <= 2 ? "var(--accent-rose)" : "var(--accent-emerald-light)" }}>
              {sessionsAfter} buổi còn lại
            </span>
          </span>
        </div>
        <div className="qr-ticket-row">
          <span className="qr-ticket-label">Thời gian</span>
          <span className="qr-ticket-value">{time}</span>
        </div>
      </div>

      {printTicket && (
        <div className="qr-ticket-print-badge">
          🖨️ Vé sẽ được in tự động
        </div>
      )}

      {sessionsAfter <= 2 && sessionsAfter > 0 && (
        <div className="qr-ticket-warning">
          ⚠️ Chỉ còn {sessionsAfter} buổi. Hãy nhắc học viên gia hạn!
        </div>
      )}
      {sessionsAfter <= 0 && (
        <div className="qr-ticket-expired">
          🚫 Đã hết buổi. Gói học chuyển sang trạng thái HẾT HẠN.
        </div>
      )}
    </div>
  );
}
