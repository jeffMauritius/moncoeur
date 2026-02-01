"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Package, Calculator } from "lucide-react";
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
  purchasePrice: number;
  refurbishmentCost: number;
  photos: string[];
  status: string;
}

function NewSaleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bagIdParam = searchParams.get("bagId");

  const [loading, setLoading] = useState(false);
  const [fetchingBag, setFetchingBag] = useState(!!bagIdParam);
  const [error, setError] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [availableBags, setAvailableBags] = useState<Bag[]>([]);
  const [selectedBag, setSelectedBag] = useState<Bag | null>(null);
  const [formData, setFormData] = useState({
    bagId: bagIdParam || "",
    saleDate: new Date().toISOString().split("T")[0],
    salePrice: "",
    salePlatform: "vinted",
    platformFees: "0",
    shippingCost: "0",
    bankAccountId: "",
    notes: "",
  });

  // Calculate margin
  const salePrice = parseFloat(formData.salePrice) || 0;
  const platformFees = parseFloat(formData.platformFees) || 0;
  const shippingCost = parseFloat(formData.shippingCost) || 0;
  const purchasePrice = selectedBag?.purchasePrice || 0;
  const refurbishmentCost = selectedBag?.refurbishmentCost || 0;

  const totalCost = purchasePrice + refurbishmentCost;
  const totalFees = platformFees + shippingCost;
  const margin = salePrice - totalCost - totalFees;
  const marginPercent = totalCost > 0 ? (margin / totalCost) * 100 : 0;

  useEffect(() => {
    fetchBankAccounts();
    fetchAvailableBags();
  }, []);

  useEffect(() => {
    if (bagIdParam) {
      fetchBag(bagIdParam);
    }
  }, [bagIdParam]);

  async function fetchBankAccounts() {
    try {
      const res = await fetch("/api/bank-accounts");
      if (res.ok) {
        const data = await res.json();
        setBankAccounts(data.filter((a: BankAccount & { isActive: boolean }) => a.isActive));
      }
    } catch {
      console.error("Error fetching bank accounts");
    }
  }

  async function fetchAvailableBags() {
    try {
      // Get bags that can be sold (status: pret_a_vendre or en_vente)
      const res = await fetch("/api/bags?status=pret_a_vendre");
      const res2 = await fetch("/api/bags?status=en_vente");
      if (res.ok && res2.ok) {
        const data1 = await res.json();
        const data2 = await res2.json();
        setAvailableBags([...data1, ...data2]);
      }
    } catch {
      console.error("Error fetching bags");
    }
  }

  async function fetchBag(id: string) {
    setFetchingBag(true);
    try {
      const res = await fetch(`/api/bags/${id}`);
      if (res.ok) {
        const bag = await res.json();
        setSelectedBag(bag);
        setFormData((prev) => ({ ...prev, bagId: id }));
      } else {
        setError("Sac non trouve");
      }
    } catch {
      setError("Erreur lors du chargement du sac");
    } finally {
      setFetchingBag(false);
    }
  }

  function handleBagChange(bagId: string) {
    const bag = availableBags.find((b) => b._id === bagId);
    setSelectedBag(bag || null);
    setFormData((prev) => ({ ...prev, bagId }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          salePrice: parseFloat(formData.salePrice),
          platformFees: parseFloat(formData.platformFees) || 0,
          shippingCost: parseFloat(formData.shippingCost) || 0,
        }),
      });

      if (res.ok) {
        const sale = await res.json();
        router.push(`/sales/${sale._id}`);
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  if (fetchingBag) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/sales">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nouvelle vente</h1>
          <p className="text-muted-foreground">
            Enregistrez la vente d&apos;un sac
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Bag Selection */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Sac a vendre</CardTitle>
              <CardDescription>
                Selectionnez le sac que vous vendez
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bagIdParam && selectedBag ? (
                <div className="flex items-center gap-4">
                  {selectedBag.photos && selectedBag.photos.length > 0 ? (
                    <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted">
                      <Image
                        src={selectedBag.photos[0]}
                        alt={`${selectedBag.brand} ${selectedBag.model}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">
                      {selectedBag.brand} - {selectedBag.model}
                    </p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {selectedBag.reference}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Cout total:{" "}
                      {totalCost.toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="bagId">Sac *</Label>
                  <Select
                    value={formData.bagId}
                    onValueChange={handleBagChange}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionnez un sac" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBags.map((bag) => (
                        <SelectItem key={bag._id} value={bag._id}>
                          {bag.reference} - {bag.brand} {bag.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableBags.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Aucun sac disponible a la vente. Mettez d&apos;abord un sac en
                      statut &quot;Pret a vendre&quot; ou &quot;En vente&quot;.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sale Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations de vente</CardTitle>
              <CardDescription>
                Details de la transaction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="saleDate">Date de vente *</Label>
                  <Input
                    id="saleDate"
                    type="date"
                    value={formData.saleDate}
                    onChange={(e) =>
                      setFormData({ ...formData, saleDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salePrice">Prix de vente (EUR) *</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.salePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, salePrice: e.target.value })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="salePlatform">Plateforme de vente *</Label>
                  <Select
                    value={formData.salePlatform}
                    onValueChange={(value) =>
                      setFormData({ ...formData, salePlatform: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PLATFORMS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccountId">Compte bancaire *</Label>
                  <Select
                    value={formData.bankAccountId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, bankAccountId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionnez un compte" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((account) => (
                        <SelectItem key={account._id} value={account._id}>
                          {account.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platformFees">Frais plateforme (EUR)</Label>
                  <Input
                    id="platformFees"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.platformFees}
                    onChange={(e) =>
                      setFormData({ ...formData, platformFees: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingCost">Frais expedition (EUR)</Label>
                  <Input
                    id="shippingCost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.shippingCost}
                    onChange={(e) =>
                      setFormData({ ...formData, shippingCost: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Notes sur la vente..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Margin Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calcul de la marge
              </CardTitle>
              <CardDescription>
                Apercu de la rentabilite
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prix de vente</span>
                  <span>
                    {salePrice.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">- Prix d&apos;achat</span>
                  <span>
                    {purchasePrice.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    - Frais remise en etat
                  </span>
                  <span>
                    {refurbishmentCost.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">- Frais plateforme</span>
                  <span>
                    {platformFees.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">- Frais expedition</span>
                  <span>
                    {shippingCost.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-medium">
                    <span>Marge</span>
                    <span className={margin >= 0 ? "text-green-600" : "text-red-600"}>
                      {margin >= 0 ? "+" : ""}
                      {margin.toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pourcentage</span>
                    <span className={margin >= 0 ? "text-green-600" : "text-red-600"}>
                      {marginPercent >= 0 ? "+" : ""}
                      {marginPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <div className="text-sm text-destructive text-center bg-destructive/10 py-2 rounded-md">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/sales">Annuler</Link>
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.bagId || !formData.salePrice}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer la vente
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewSalePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <NewSaleForm />
    </Suspense>
  );
}
