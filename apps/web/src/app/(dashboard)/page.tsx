import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, ShoppingCart, Euro, TrendingUp } from "lucide-react";
import dbConnect from "@/lib/db/mongodb";
import { Bag, Sale } from "@/lib/db/models";
import { DashboardCharts } from "./dashboard-charts";
import { PLATFORMS } from "@moncoeur/shared";

export const dynamic = "force-dynamic";

async function getDashboardStats() {
  await dbConnect();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // Get bag counts by status
  const bagStats = await Bag.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const bagsByStatus = bagStats.reduce(
    (acc, item) => {
      acc[item._id] = item.count;
      return acc;
    },
    {} as Record<string, number>
  );

  // Total bags in stock (not sold)
  const totalInStock =
    Object.entries(bagsByStatus)
      .filter(([status]) => status !== "vendu")
      .reduce((sum, [, count]) => sum + (count as number), 0);

  // Sales this month
  const salesThisMonth = await Sale.find({
    saleDate: { $gte: startOfMonth },
  });

  const monthlyRevenue = salesThisMonth.reduce(
    (sum, sale) => sum + sale.salePrice,
    0
  );
  const monthlyMargin = salesThisMonth.reduce(
    (sum, sale) => sum + sale.margin,
    0
  );
  const salesCount = salesThisMonth.length;

  // Recent sales
  const recentSales = await Sale.find()
    .sort({ saleDate: -1 })
    .limit(5)
    .populate("bagId", "brand model reference");

  // Monthly sales data for chart (last 6 months)
  const monthlySalesData = await Sale.aggregate([
    {
      $match: {
        saleDate: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$saleDate" },
          month: { $month: "$saleDate" },
        },
        revenue: { $sum: "$salePrice" },
        margin: { $sum: "$margin" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  const monthNames = ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil", "Aout", "Sep", "Oct", "Nov", "Dec"];
  const chartData = monthlySalesData.map((item) => ({
    month: monthNames[item._id.month - 1],
    revenue: item.revenue,
    margin: item.margin,
  }));

  // Sales by platform
  const platformData = await Sale.aggregate([
    {
      $group: {
        _id: "$salePlatform",
        value: { $sum: "$salePrice" },
        count: { $sum: 1 },
      },
    },
  ]);

  const platformChartData = platformData.map((item) => ({
    name: PLATFORMS[item._id as keyof typeof PLATFORMS] || item._id,
    value: item.value,
    count: item.count,
  }));

  // Top brands
  const topBrands = await Sale.aggregate([
    {
      $lookup: {
        from: "bags",
        localField: "bagId",
        foreignField: "_id",
        as: "bag",
      },
    },
    {
      $unwind: "$bag",
    },
    {
      $group: {
        _id: "$bag.brand",
        revenue: { $sum: "$salePrice" },
        margin: { $sum: "$margin" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { revenue: -1 },
    },
    {
      $limit: 5,
    },
  ]);

  return {
    totalInStock,
    salesCount,
    monthlyRevenue,
    monthlyMargin,
    bagsByStatus,
    recentSales: recentSales.map((sale) => {
      const bag = sale.bagId as unknown as { brand: string; model: string; reference: string } | null;
      return {
        _id: sale._id.toString(),
        salePrice: sale.salePrice,
        margin: sale.margin,
        saleDate: sale.saleDate,
        bag: bag
          ? {
              brand: bag.brand,
              model: bag.model,
              reference: bag.reference,
            }
          : null,
      };
    }),
    chartData,
    platformChartData,
    topBrands: topBrands.map((b) => ({
      brand: b._id,
      revenue: b.revenue,
      margin: b.margin,
      count: b.count,
    })),
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bonjour, {session?.user?.name?.split(" ")[0]} !
        </h1>
        <p className="text-muted-foreground">
          Voici un apercu de votre activite ce mois-ci.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Chiffre d&apos;affaires
            </CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.monthlyRevenue.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
            <p className="text-xs text-muted-foreground">Ce mois-ci</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marge totale</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.monthlyMargin.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
            <p className="text-xs text-muted-foreground">Ce mois-ci</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInStock}</div>
            <p className="text-xs text-muted-foreground">Sacs disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.salesCount}</div>
            <p className="text-xs text-muted-foreground">Ce mois-ci</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <DashboardCharts
        chartData={stats.chartData}
        platformChartData={stats.platformChartData}
      />

      {/* Recent Sales & Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Dernieres ventes</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune vente pour le moment
              </p>
            ) : (
              <div className="space-y-4">
                {stats.recentSales.map((sale) => (
                  <div
                    key={sale._id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {sale.bag
                          ? `${sale.bag.brand} - ${sale.bag.model}`
                          : "Sac supprime"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sale.bag?.reference}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {sale.salePrice.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </p>
                      <p className="text-xs text-green-600">
                        +
                        {sale.margin.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Stock par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { key: "en_commande", label: "En commande", color: "bg-yellow-500" },
                { key: "en_transit", label: "En transit", color: "bg-blue-500" },
                { key: "recu", label: "Recu", color: "bg-purple-500" },
                { key: "en_remise_en_etat", label: "En remise en etat", color: "bg-orange-500" },
                { key: "pret_a_vendre", label: "Pret a vendre", color: "bg-green-500" },
                { key: "en_vente", label: "En vente", color: "bg-indigo-500" },
              ].map((status) => (
                <div key={status.key} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${status.color}`} />
                  <span className="text-sm flex-1">{status.label}</span>
                  <span className="text-sm font-medium">
                    {stats.bagsByStatus[status.key] || 0}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Brands */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Marques</CardTitle>
          <CardDescription>Par chiffre d&apos;affaires</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.topBrands.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune donnee disponible
            </p>
          ) : (
            <div className="space-y-4">
              {stats.topBrands.map((brand, index) => (
                <div key={brand.brand} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{brand.brand}</p>
                    <p className="text-xs text-muted-foreground">
                      {brand.count} vente(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {brand.revenue.toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </p>
                    <p className="text-xs text-green-600">
                      +{brand.margin.toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
