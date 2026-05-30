"use client";

interface StatCardsProps {
  stats: {
    totalStudents: number;
    totalCheckins: number;
    totalShifts: number;
    totalRevenue: number;
  };
}

export default function StatCards({ stats }: StatCardsProps) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  return (
    <div className="reports-stats">
      <div className="stat-card">
        <div className="stat-icon stat-icon-indigo">👥</div>
        <div>
          <div className="stat-value">{stats.totalStudents}</div>
          <div className="stat-label">Tổng học viên</div>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon stat-icon-emerald">💰</div>
        <div>
          <div className="stat-value">{formatPrice(stats.totalRevenue)}</div>
          <div className="stat-label">Tổng doanh thu</div>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon stat-icon-amber">🎫</div>
        <div>
          <div className="stat-value">{stats.totalCheckins}</div>
          <div className="stat-label">Lượt Check-in</div>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon stat-icon-cyan">🕐</div>
        <div>
          <div className="stat-value">{stats.totalShifts}</div>
          <div className="stat-label">Ca học đang mở</div>
        </div>
      </div>
    </div>
  );
}
