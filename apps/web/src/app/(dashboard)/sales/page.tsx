"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Loader2, ShoppingCart, Package, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { PLATFORMS, BRANDS } from "@moncoeur/shared";

interface BankAccount {
  _id: string;
  label: string;
}

interface Bag {
  _id: string;
  reference: string;
  brand: string;
  model: string;
  photos: string[];
}

interface Sale {
  _id: string;
  bagId: Bag;
  saleDate: string;
  salePrice: number;
  salePlatform: keyof typeof PLATFORMS;
  margin: number;
  marginPercent: number;
  bankAccountId: { _id: string; label: string };
  soldBy: { name: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const MONTH_NAMES = [
  "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
];

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [bankAccountFilter, setBankAccountFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"month" | "year" | "custom">("month");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const { startDate, endDate } = useMemo(() => {
    if (viewMode === "custom") {
      return {
        startDate: customStartDate || "",
        endDate: customEndDate || "",
      };
    }
    if (viewMode === "year") {
      return {
        startDate: `${selectedYear}-01-01`,
        endDate: `${selectedYear}-12-31`,
      };
    }
    const month = String(selectedMonth + 1).padStart(2, "0");
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    return {
      startDate: `${selectedYear}-${month}-01`,
      endDate: `${selectedYear}-${month}-${String(lastDay).padStart(2, "0")}`,
    };
  }, [viewMode, selectedYear, selectedMonth, customStartDate, customEndDate]);

  useEffect(() => {
    async function fetchBankAccounts() {
      try {
        const res = await fetch("/api/bank-accounts");
        if (res.ok) {
          const data = await res.json();
          setBankAccounts(data);
        }
      } catch {
        console.error("Error fetching bank accounts");
      }
    }
    fetchBankAccounts();
  }, []);

  async function fetchSales(page = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", "20");
      if (bankAccountFilter !== "all") {
        params.append("bankAccountId", bankAccountFilter);
      }
      if (platformFilter !== "all") {
        params.append("platform", platformFilter);
      }
      if (brandFilter !== "all") {
        params.append("brand", brandFilter);
      }
      if (startDate) {
        params.append("startDate", startDate);
      }
      if (endDate) {
        params.append("endDate", endDate);
      }

      const res = await fetch(`/api/sales?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSales(data.sales);
        setPagination(data.pagination);
      }
    } catch {
      console.error("Error fetching sales");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSales(1);
  }, [bankAccountFilter, platformFilter, brandFilter, startDate, endDate]);

  function handlePageChange(newPage: number) {
    fetchSales(newPage);
  }

  function resetFilters() {
    setBankAccountFilter("all");
    setPlatformFilter("all");
    setBrandFilter("all");
    setViewMode("month");
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth(new Date().getMonth());
    setCustomStartDate("");
    setCustomEndDate("");
  }

  function goToPrevious() {
    if (viewMode === "year") {
      setSelectedYear((y) => y - 1);
    } else {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear((y) => y - 1);
      } else {
        setSelectedMonth((m) => m - 1);
      }
    }
  }

  function goToNext() {
    if (viewMode === "year") {
      setSelectedYear((y) => y + 1);
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear((y) => y + 1);
      } else {
        setSelectedMonth((m) => m + 1);
      }
    }
  }

  const periodLabel =
    viewMode === "year"
      ? String(selectedYear)
      : `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;

  // Calculate totals
  const totalRevenue = sales.reduce((sum, s) => sum + s.salePrice, 0);
  const totalMargin = sales.reduce((sum, s) => sum + s.margin, 0);
  const avgMarginPercent =
    sales.length > 0
      ? sales.reduce((sum, s) => sum + s.marginPercent, 0) / sales.length
      : 0;

  if (loading && sales.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ventes</h1>
          <p className="text-muted-foreground">
            Historique des ventes et performances
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Chiffre d&apos;affaires
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRevenue.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {pagination.total} vente(s) au total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marge totale</CardTitle>
            {totalMargin >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                totalMargin >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {totalMargin.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Marge moyenne: {avgMarginPercent.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Nombre de ventes
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">Sacs vendus</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
            {/* Period selector */}
            <div className="flex items-center gap-1 rounded-md border p-1">
              <Button
                variant={viewMode === "month" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("month")}
              >
                Mois
              </Button>
              <Button
                variant={viewMode === "year" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("year")}
              >
                Annee
              </Button>
              <Button
                variant={viewMode === "custom" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("custom")}
              >
                Personnalise
              </Button>
            </div>

            {/* Period navigation or custom date inputs */}
            {viewMode === "custom" ? (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="rounded-md border px-3 py-1.5 text-sm"
                />
                <span className="text-muted-foreground">—</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="rounded-md border px-3 py-1.5 text-sm"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={goToPrevious}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[160px] text-center font-medium">
                  {periodLabel}
                </span>
                <Button variant="outline" size="icon" onClick={goToNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Select value={bankAccountFilter} onValueChange={setBankAccountFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Tous les comptes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les comptes</SelectItem>
                {bankAccounts.map((account) => (
                  <SelectItem key={account._id} value={account._id}>
                    {account.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Toutes les plateformes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les plateformes</SelectItem>
                {Object.entries(PLATFORMS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Toutes les marques" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les marques</SelectItem>
                {BRANDS.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="w-full sm:w-auto" onClick={resetFilters}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des ventes</CardTitle>
          <CardDescription>
            {pagination.total} vente(s) trouvee(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Aucune vente</h3>
              <p className="text-muted-foreground">
                Les ventes apparaitront ici une fois enregistrees
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Photo</TableHead>
                    <TableHead>Sac</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Prix vente</TableHead>
                    <TableHead>Marge</TableHead>
                    <TableHead>Plateforme</TableHead>
                    <TableHead>Compte</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale._id}>
                      <TableCell>
                        {sale.bagId?.photos && sale.bagId.photos.length > 0 ? (
                          <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted">
                            <Image
                              src={sale.bagId.photos[0]}
                              alt={`${sale.bagId?.brand} ${sale.bagId?.model}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {sale.bagId?.brand} - {sale.bagId?.model}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {sale.bagId?.reference}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(sale.saleDate).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {sale.salePrice.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </TableCell>
                      <TableCell>
                        <div
                          className={
                            sale.margin >= 0 ? "text-green-600" : "text-red-600"
                          }
                        >
                          <p className="font-medium">
                            {sale.margin >= 0 ? "+" : ""}
                            {sale.margin.toLocaleString("fr-FR", {
                              style: "currency",
                              currency: "EUR",
                            })}
                          </p>
                          <p className="text-xs">
                            {sale.marginPercent.toFixed(1)}%
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {PLATFORMS[sale.salePlatform] || sale.salePlatform}
                      </TableCell>
                      <TableCell>{sale.bankAccountId?.label || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/sales/${sale._id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} sur {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Precedent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages || loading}
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
