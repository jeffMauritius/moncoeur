"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { SalesChart, PlatformChart } from "@/components/dashboard";

interface DashboardChartsProps {
  chartData: {
    month: string;
    revenue: number;
    margin: number;
  }[];
  platformChartData: {
    name: string;
    value: number;
    count: number;
  }[];
}

export function DashboardCharts({ chartData, platformChartData }: DashboardChartsProps) {
  function handleExport(type: "sales" | "stock") {
    const link = document.createElement("a");
    link.href = `/api/export?type=${type}&format=csv`;
    link.download = `${type}_export.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <>
      {/* Export Buttons */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={() => handleExport("sales")}>
          <Download className="h-4 w-4 mr-2" />
          Exporter ventes (CSV)
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleExport("stock")}>
          <Download className="h-4 w-4 mr-2" />
          Exporter stock (CSV)
        </Button>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Evolution CA & Marge</CardTitle>
            <CardDescription>6 derniers mois</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Aucune donnee disponible
              </div>
            ) : (
              <SalesChart data={chartData} />
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Ventes par plateforme</CardTitle>
            <CardDescription>Repartition du CA</CardDescription>
          </CardHeader>
          <CardContent>
            {platformChartData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Aucune donnee disponible
              </div>
            ) : (
              <PlatformChart data={platformChartData} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
