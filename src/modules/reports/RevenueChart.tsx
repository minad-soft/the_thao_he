"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

interface RevenueChartProps {
  data: Array<{
    package_name: string;
    subject: string;
    revenue: number;
    students: number;
  }>;
}

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

export default function RevenueChart({ data }: RevenueChartProps) {
  const formatPrice = (value: number) =>
    new Intl.NumberFormat("vi-VN", { notation: "compact", compactDisplay: "short" }).format(value);



  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <h3 className="card-title">💰 Doanh thu theo gói học</h3>
      </div>
      <div className="card-body" style={{ height: 320, padding: "20px 20px 0 0" }}>
        {data.length === 0 ? (
          <div className="empty-state">Chưa có dữ liệu doanh thu</div>
        ) : (
          <div className="chart-wrapper-mobile-scroll" style={{ height: "100%" }}>
            <div className="chart-inner-min-width">
              <ResponsiveContainer width="100%" height="100%" className="recharts-responsive-container">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="package_name" 
                    stroke="var(--text-muted)" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                  />
                  <YAxis 
                    stroke="var(--text-muted)" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatPrice(value)}
                    width={80}
                  />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                  <Bar 
                    dataKey="revenue" 
                    fill="var(--accent-indigo)" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`var(--accent-indigo)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
