"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface PlatformChartProps {
  data: {
    name: string;
    value: number;
    count: number;
  }[];
}

const COLORS = ["#f472b6", "#818cf8", "#facc15", "#22c55e"];

export function PlatformChart({ data }: PlatformChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) =>
            `${name} (${(percent * 100).toFixed(0)}%)`
          }
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) =>
            value.toLocaleString("fr-FR", {
              style: "currency",
              currency: "EUR",
            })
          }
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
