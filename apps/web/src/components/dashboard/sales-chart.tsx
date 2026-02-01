"use client";

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

interface SalesChartProps {
  data: {
    month: string;
    revenue: number;
    margin: number;
  }[];
}

export function SalesChart({ data }: SalesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip
          formatter={(value: number) =>
            value.toLocaleString("fr-FR", {
              style: "currency",
              currency: "EUR",
            })
          }
        />
        <Legend />
        <Bar dataKey="revenue" name="CA" fill="#f472b6" />
        <Bar dataKey="margin" name="Marge" fill="#22c55e" />
      </BarChart>
    </ResponsiveContainer>
  );
}
