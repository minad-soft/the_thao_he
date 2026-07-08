"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface RevenueBySchoolChartProps {
  data: Array<any>;
}

const COLORS = [
  "var(--accent-emerald)",
  "var(--accent-blue)",
  "var(--accent-purple)",
  "#f59e0b",
  "#ef4444",
];

export default function RevenueBySchoolChart({ data }: RevenueBySchoolChartProps) {
  const formatPrice = (value: number) =>
    new Intl.NumberFormat("vi-VN", { notation: "compact", compactDisplay: "short" }).format(value);

  // Extract all payment methods dynamically to create Stacked Bars
  const paymentMethods = useMemo(() => {
    const methods = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== "schoolName") {
          methods.add(key);
        }
      });
    });
    return Array.from(methods);
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      let total = 0;
      return (
        <div className="chart-tooltip">
          <div className="chart-tooltip-title">{label}</div>
          {payload.map((entry: any, index: number) => {
            total += entry.value;
            return (
              <div key={index} className="chart-tooltip-sub" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 10, height: 10, backgroundColor: entry.color, borderRadius: '50%' }}></div>
                {entry.name}: {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(entry.value)}
              </div>
            );
          })}
          <div className="chart-tooltip-value" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            Tổng cộng: {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(total)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <h3 className="card-title">🏫 Doanh thu theo Trường</h3>
      </div>
      <div className="card-body" style={{ height: 320, padding: "20px 20px 0 0" }}>
        {data.length === 0 ? (
          <div className="empty-state">Chưa có dữ liệu doanh thu</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="schoolName" 
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
              <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-muted)' }} />
              {paymentMethods.map((method, index) => (
                <Bar 
                  key={method}
                  dataKey={method} 
                  stackId="a" 
                  fill={COLORS[index % COLORS.length]} 
                  maxBarSize={60}
                  radius={
                    index === paymentMethods.length - 1 
                      ? [4, 4, 0, 0] // Top rounded for the last item in stack
                      : [0, 0, 0, 0]
                  }
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
