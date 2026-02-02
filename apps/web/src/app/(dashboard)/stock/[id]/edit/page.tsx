"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { BRANDS, CONDITIONS, PLATFORMS, STATUSES } from "@moncoeur/shared";

interface BankAccount {
  _id: string;
  label: string;
  isActive: boolean;
}

interface Bag {
  _id: string;
  reference: string;
  brand: string;
  model: string;
  description: string;
  color?: string;
  size?: string;
  condition: string;
  purchaseDate: string;
  purchasePrice: number;
  purchasePlatform: string;
  purchaseBankAccountId: { _id: string } | string;
  refurbishmentCost: number;
  refurbishmentProvider?: string;
  refurbishmentNotes?: string;
  salePrice?: number;
  saleNotes?: string;
  photos: string[];
  status: string;
}

export default function EditBagPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchingBag, setFetchingBag] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    description: "",
    color: "",
    size: "",
    condition: "tres_bon",
    purchaseDate: new Date().toISOString().split("T")[0],
    purchasePrice: "",
    purchasePlatform: "vinted",
    purchaseBankAccountId: "",
    refurbishmentCost: "0",
    refurbishmentProvider: "",
    refurbishmentNotes: "",
    status: "en_commande",
    salePrice: "",
    saleNotes: "",
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [bagRes, accountsRes] = await Promise.all([
          fetch(`/api/bags/${id}`),
          fetch("/api/bank-accounts"),
        ]);

        if (bagRes.ok) {
          const bag: Bag = await bagRes.json();
          const bankAccountId = typeof bag.purchaseBankAccountId === 'object'
            ? bag.purchaseBankAccountId._id
            : bag.purchaseBankAccountId;
          setFormData({
            brand: bag.brand,
            model: bag.model,
            description: bag.description,
            color: bag.color || "",
            size: bag.size || "",
            condition: bag.condition,
            purchaseDate: new Date(bag.purchaseDate).toISOString().split("T")[0],
            purchasePrice: bag.purchasePrice.toString(),
            purchasePlatform: bag.purchasePlatform,
            purchaseBankAccountId: bankAccountId,
            refurbishmentCost: bag.refurbishmentCost.toString(),
            refurbishmentProvider: bag.refurbishmentProvider || "",
            refurbishmentNotes: bag.refurbishmentNotes || "",
            status: bag.status,
            salePrice: bag.salePrice?.toString() || "",
            saleNotes: bag.saleNotes || "",
          });
          setPhotos(bag.photos || []);
        } else {
          setError("Sac non trouve");
        }

        if (accountsRes.ok) {
          const accounts = await accountsRes.json();
          setBankAccounts(accounts);
        }
      } catch {
        setError("Erreur lors du chargement");
      } finally {
        setFetchingBag(false);
      }
    }
    fetchData();
  }, [id]);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (res.ok) {
          const data = await res.json();
          setPhotos((prev) => [...prev, data.url]);
        } else {
          const data = await res.json();
          setError(data.error);
        }
      }
    } catch {
      setError("Erreur lors de l'upload des photos");
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/bags/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          purchasePrice: parseFloat(formData.purchasePrice),
          refurbishmentCost: parseFloat(formData.refurbishmentCost) || 0,
          salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
          photos,
        }),
      });

      if (res.ok) {
        router.push(`/stock/${id}`);
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
          <Link href={`/stock/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modifier le sac</h1>
          <p className="text-muted-foreground">
            Modifiez les informations du sac
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Product Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations produit</CardTitle>
              <CardDescription>
                Details du sac
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="brand">Marque *</Label>
                  <Select
                    value={formData.brand}
                    onValueChange={(value) => setFormData({ ...formData, brand: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionnez une marque" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRANDS.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modele *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Ex: Neverfull, Pliage..."
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description detaillee du sac..."
                  rows={3}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="color">Couleur</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Ex: Noir, Beige, Marron..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Taille</Label>
                  <Input
                    id="size"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="Ex: S, M, L ou dimensions"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Etat *</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => setFormData({ ...formData, condition: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONDITIONS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations d&apos;achat</CardTitle>
              <CardDescription>
                Details de l&apos;acquisition
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Date d&apos;achat *</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Prix d&apos;achat (EUR) *</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="purchasePlatform">Plateforme d&apos;achat *</Label>
                  <Select
                    value={formData.purchasePlatform}
                    onValueChange={(value) => setFormData({ ...formData, purchasePlatform: value })}
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
                  <Label htmlFor="purchaseBankAccountId">Compte bancaire *</Label>
                  <Select
                    value={formData.purchaseBankAccountId}
                    onValueChange={(value) => setFormData({ ...formData, purchaseBankAccountId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionnez un compte" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts
                        .filter((a) => a.isActive || a._id === formData.purchaseBankAccountId)
                        .map((account) => (
                          <SelectItem key={account._id} value={account._id}>
                            {account.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUSES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Refurbishment */}
          <Card>
            <CardHeader>
              <CardTitle>Remise en etat</CardTitle>
              <CardDescription>
                Frais de restauration (optionnel)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="refurbishmentCost">Frais (EUR)</Label>
                  <Input
                    id="refurbishmentCost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.refurbishmentCost}
                    onChange={(e) => setFormData({ ...formData, refurbishmentCost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refurbishmentProvider">Prestataire</Label>
                  <Input
                    id="refurbishmentProvider"
                    value={formData.refurbishmentProvider}
                    onChange={(e) => setFormData({ ...formData, refurbishmentProvider: e.target.value })}
                    placeholder="Ex: Gianni"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="refurbishmentNotes">Notes</Label>
                <Textarea
                  id="refurbishmentNotes"
                  value={formData.refurbishmentNotes}
                  onChange={(e) => setFormData({ ...formData, refurbishmentNotes: e.target.value })}
                  placeholder="Notes sur la remise en etat..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sale Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations de vente</CardTitle>
              <CardDescription>
                Details pour la vente (optionnel)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="salePrice">Prix de vente (EUR)</Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saleNotes">Commentaire</Label>
                <Textarea
                  id="saleNotes"
                  value={formData.saleNotes}
                  onChange={(e) => setFormData({ ...formData, saleNotes: e.target.value })}
                  placeholder="Notes sur la vente..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>
                Gerez les photos du sac
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-muted">
                    <Image
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <label className="aspect-square rounded-md border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer flex items-center justify-center transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  )}
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Formats acceptes: JPG, PNG, WebP, GIF. Max 5MB par fichier.
              </p>
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
            <Link href={`/stock/${id}`}>Annuler</Link>
          </Button>
          <Button type="submit" disabled={loading || uploading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </div>
  );
}
