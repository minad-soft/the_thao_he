"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CheckinChartProps {
  data: Array<{
    date: string;
    count: number;
  }>;
}

export default function CheckinChart({ data }: CheckinChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <div className="chart-tooltip-title">Ngày {label}</div>
          <div className="chart-tooltip-value">
            {payload[0].value} lượt check-in
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <h3 className="card-title">📈 Lượt check-in 7 ngày qua</h3>
      </div>
      <div className="card-body" style={{ height: 320, padding: "20px 20px 0 0" }}>
        {data.length === 0 ? (
          <div className="empty-state">Chưa có dữ liệu check-in</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorCheckin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-indigo)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--accent-indigo)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="var(--text-muted)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="var(--text-muted)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="var(--accent-indigo)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCheckin)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
