import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import dbConnect from "@/lib/db/mongodb";
import { Bag, Sale } from "@/lib/db/models";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Pencil, Package, ShoppingCart, QrCode } from "lucide-react";
import { CONDITIONS, PLATFORMS, STATUSES } from "@moncoeur/shared";
import { QRCodeDisplay } from "./qr-code-display";

const STATUS_COLORS: Record<string, string> = {
  en_commande: "bg-yellow-100 text-yellow-800",
  en_transit: "bg-blue-100 text-blue-800",
  recu: "bg-purple-100 text-purple-800",
  en_remise_en_etat: "bg-orange-100 text-orange-800",
  pret_a_vendre: "bg-green-100 text-green-800",
  en_vente: "bg-indigo-100 text-indigo-800",
  vendu: "bg-gray-100 text-gray-800",
};

async function getBag(id: string) {
  await dbConnect();

  const bag = await Bag.findById(id)
    .populate("purchaseBankAccountId", "label")
    .populate("createdBy", "name")
    .lean();

  if (!bag) return null;

  // Check if sold
  const sale = await Sale.findOne({ bagId: id })
    .populate("bankAccountId", "label")
    .populate("soldBy", "name")
    .lean();

  return {
    bag: JSON.parse(JSON.stringify(bag)),
    sale: sale ? JSON.parse(JSON.stringify(sale)) : null,
  };
}

export default async function BagDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getBag(id);

  if (!data) {
    notFound();
  }

  const { bag, sale } = data;
  const totalCost = bag.purchasePrice + (bag.refurbishmentCost || 0);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="gap-1">
          <Link href="/stock">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </Button>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {bag.brand} - {bag.model}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={STATUS_COLORS[bag.status] || ""}>
                {STATUSES[bag.status as keyof typeof STATUSES] || bag.status}
              </Badge>
              <span className="text-muted-foreground font-mono text-sm">{bag.reference}</span>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            {bag.status !== "vendu" && (
              <Button size="sm" asChild className="flex-1 md:flex-initial">
                <Link href={`/sales/new?bagId=${bag._id}`}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Vendre
                </Link>
              </Button>
            )}
            <Button variant="outline" size="sm" asChild className="flex-1 md:flex-initial">
              <Link href={`/stock/${bag._id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Modifier
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Photos */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Photos</CardTitle>
          </CardHeader>
          <CardContent>
            {bag.photos && bag.photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {bag.photos.map((photo: string, index: number) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden bg-muted"
                  >
                    <Image
                      src={photo}
                      alt={`${bag.brand} ${bag.model} - Photo ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 bg-muted rounded-lg">
                <Package className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code
            </CardTitle>
            <CardDescription>
              Scannez pour acceder a cette fiche
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QRCodeDisplay bagId={bag._id} reference={bag.reference} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Product Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informations produit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Marque</p>
                <p className="font-medium">{bag.brand}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modele</p>
                <p className="font-medium">{bag.model}</p>
              </div>
              {bag.color && (
                <div>
                  <p className="text-sm text-muted-foreground">Couleur</p>
                  <p className="font-medium">{bag.color}</p>
                </div>
              )}
              {bag.size && (
                <div>
                  <p className="text-sm text-muted-foreground">Taille</p>
                  <p className="font-medium">{bag.size}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Etat</p>
                <p className="font-medium">
                  {CONDITIONS[bag.condition as keyof typeof CONDITIONS] || bag.condition}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="mt-1">{bag.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informations d&apos;achat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Date d&apos;achat</p>
                <p className="font-medium">
                  {new Date(bag.purchaseDate).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prix d&apos;achat</p>
                <p className="font-medium">
                  {bag.purchasePrice.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plateforme</p>
                <p className="font-medium">
                  {PLATFORMS[bag.purchasePlatform as keyof typeof PLATFORMS] || bag.purchasePlatform}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Compte bancaire</p>
                <p className="font-medium">
                  {bag.purchaseBankAccountId?.label || "-"}
                </p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Frais remise en etat</p>
                <p className="font-medium">
                  {(bag.refurbishmentCost || 0).toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </p>
              </div>
              {bag.refurbishmentProvider && (
                <div>
                  <p className="text-sm text-muted-foreground">Prestataire</p>
                  <p className="font-medium">{bag.refurbishmentProvider}</p>
                </div>
              )}
            </div>
            {bag.refurbishmentNotes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes remise en etat</p>
                <p className="mt-1">{bag.refurbishmentNotes}</p>
              </div>
            )}
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Cout total</p>
              <p className="text-xl font-bold text-primary">
                {totalCost.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sale Info (if sold) */}
        {sale && (
          <Card className="md:col-span-2 border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="text-green-800">Informations de vente</CardTitle>
              <CardDescription>Ce sac a ete vendu</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date de vente</p>
                  <p className="font-medium">
                    {new Date(sale.saleDate).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prix de vente</p>
                  <p className="font-medium">
                    {sale.salePrice.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Marge</p>
                  <p className={`font-medium ${sale.margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {sale.margin.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                    <span className="text-xs ml-1">
                      ({sale.marginPercent.toFixed(1)}%)
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vendu par</p>
                  <p className="font-medium">{sale.soldBy?.name || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="flex justify-between text-sm text-muted-foreground">
              <p>
                Cree par {bag.createdBy?.name || "-"} le{" "}
                {new Date(bag.createdAt).toLocaleDateString("fr-FR")}
              </p>
              <p>
                Derniere modification :{" "}
                {new Date(bag.updatedAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
