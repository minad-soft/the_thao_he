"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RevenueChartProps {
  data: Array<{
    package_name: string;
    subject: string;
    revenue: number;
    students: number;
  }>;
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const formatPrice = (value: number) =>
    new Intl.NumberFormat("vi-VN", { notation: "compact", compactDisplay: "short" }).format(value);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <div className="chart-tooltip-title">{label}</div>
          <div className="chart-tooltip-value">
            Doanh thu: {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(payload[0].value)}
          </div>
          <div className="chart-tooltip-sub">
            Học viên: {payload[0].payload.students}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <h3 className="card-title">💰 Doanh thu theo gói học</h3>
      </div>
      <div className="card-body" style={{ height: 320, padding: "20px 20px 0 0" }}>
        {data.length === 0 ? (
          <div className="empty-state">Chưa có dữ liệu doanh thu</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="package_name" 
                stroke="var(--text-muted)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="var(--text-muted)" 
                fontSize={12}
                tickFormatter={formatPrice}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar 
                dataKey="revenue" 
                fill="var(--accent-emerald)" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
