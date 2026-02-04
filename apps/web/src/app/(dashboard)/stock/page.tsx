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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Eye, Loader2, Package, ChevronLeft, ChevronRight } from "lucide-react";

const STATUSES = {
  en_commande: { label: "En commande", color: "bg-yellow-100 text-yellow-800" },
  en_transit: { label: "En transit", color: "bg-blue-100 text-blue-800" },
  recu: { label: "Recu", color: "bg-purple-100 text-purple-800" },
  en_remise_en_etat: { label: "En remise en etat", color: "bg-orange-100 text-orange-800" },
  pret_a_vendre: { label: "Pret a vendre", color: "bg-green-100 text-green-800" },
  en_vente: { label: "En vente", color: "bg-indigo-100 text-indigo-800" },
  vendu: { label: "Vendu", color: "bg-gray-100 text-gray-800" },
};

interface Bag {
  _id: string;
  reference: string;
  brand: string;
  model: string;
  description: string;
  purchasePrice: number;
  purchaseBankAccountId?: { _id: string; label: string };
  status: keyof typeof STATUSES;
  photos: string[];
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function StockPage() {
  const [bags, setBags] = useState<Bag[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("disponible");

  async function loadBags(page = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", "20");
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (search) {
        params.append("search", search);
      }

      const res = await fetch(`/api/bags?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBags(data.bags);
        setPagination(data.pagination);
      }
    } catch {
      console.error("Error fetching bags");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBags(1);
  }, [statusFilter]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadBags(1);
  }

  function handlePageChange(newPage: number) {
    loadBags(newPage);
  }

  if (loading && bags.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock</h1>
          <p className="text-muted-foreground">
            Gerez votre inventaire de sacs
          </p>
        </div>
        <Button className="w-full sm:w-auto" asChild>
          <Link href="/stock/new">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un nouveau sac
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par reference, marque, modele..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-3 sm:gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="flex-1 sm:w-[200px]">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="disponible">Disponible (Prêt + En vente)</SelectItem>
                  {Object.entries(STATUSES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rechercher"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Bags Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des sacs</CardTitle>
          <CardDescription>
            {pagination.total} sac(s) trouve(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bags.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Aucun sac</h3>
              <p className="text-muted-foreground">
                Commencez par ajouter votre premier sac
              </p>
              <Button asChild className="mt-4">
                <Link href="/stock/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un sac
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Photo</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Marque</TableHead>
                    <TableHead>Modele</TableHead>
                    <TableHead>Prix achat</TableHead>
                    <TableHead>Compte</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bags.map((bag) => (
                    <TableRow key={bag._id}>
                      <TableCell>
                        {bag.photos && bag.photos.length > 0 ? (
                          <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted">
                            <Image
                              src={bag.photos[0]}
                              alt={`${bag.brand} ${bag.model}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {bag.reference}
                      </TableCell>
                      <TableCell className="font-medium">{bag.brand}</TableCell>
                      <TableCell>{bag.model}</TableCell>
                      <TableCell>
                        {bag.purchasePrice.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </TableCell>
                      <TableCell>
                        {bag.purchaseBankAccountId?.label || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUSES[bag.status]?.color || ""}>
                          {STATUSES[bag.status]?.label || bag.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/stock/${bag._id}`}>
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
