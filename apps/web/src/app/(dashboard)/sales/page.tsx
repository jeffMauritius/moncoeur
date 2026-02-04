"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, Loader2, ShoppingCart, Package, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { PLATFORMS } from "@moncoeur/shared";

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

// Get current year date range for default filter
function getCurrentYearDateRange() {
  const year = new Date().getFullYear();
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  return { startDate, endDate };
}

const defaultDateRange = getCurrentYearDateRange();

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
  const [startDate, setStartDate] = useState(defaultDateRange.startDate);
  const [endDate, setEndDate] = useState(defaultDateRange.endDate);

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
  }, [bankAccountFilter, platformFilter, startDate, endDate]);

  function handlePageChange(newPage: number) {
    fetchSales(newPage);
  }

  function resetFilters() {
    setBankAccountFilter("all");
    setPlatformFilter("all");
    const { startDate, endDate } = getCurrentYearDateRange();
    setStartDate(startDate);
    setEndDate(endDate);
  }

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
          <div className="grid gap-3 sm:flex sm:flex-wrap sm:gap-4">
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

            <div className="flex items-center gap-2">
              <Label htmlFor="startDate" className="text-sm whitespace-nowrap">Du</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 sm:w-[160px]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="endDate" className="text-sm whitespace-nowrap">Au</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 sm:w-[160px]"
              />
            </div>

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
