import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import dbConnect from "@/lib/db/mongodb";
import { Sale } from "@/lib/db/models";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Package, TrendingUp, TrendingDown } from "lucide-react";
import { PLATFORMS } from "@moncoeur/shared";

export const dynamic = "force-dynamic";

async function getSale(id: string) {
  await dbConnect();

  const sale = await Sale.findById(id)
    .populate({
      path: "bagId",
      populate: {
        path: "purchaseBankAccountId",
        select: "label",
      },
    })
    .populate("bankAccountId", "label")
    .populate("soldBy", "name email")
    .lean();

  if (!sale) return null;

  return JSON.parse(JSON.stringify(sale));
}

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sale = await getSale(id);

  if (!sale) {
    notFound();
  }

  const bag = sale.bagId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/sales">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Vente #{sale._id.slice(-6).toUpperCase()}
            </h1>
            <p className="text-muted-foreground">
              {new Date(sale.saleDate).toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        {bag && (
          <Button variant="outline" asChild>
            <Link href={`/stock/${bag._id}`}>
              Voir le sac
            </Link>
          </Button>
        )}
      </div>

      {/* Margin Overview */}
      <Card className={sale.margin >= 0 ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {sale.margin >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600" />
              )}
              <div>
                <p className="text-sm text-muted-foreground">Marge realisee</p>
                <p className={`text-3xl font-bold ${sale.margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {sale.margin >= 0 ? "+" : ""}
                  {sale.margin.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Pourcentage</p>
              <p className={`text-2xl font-bold ${sale.margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                {sale.marginPercent.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Bag Info */}
        {bag && (
          <Card>
            <CardHeader>
              <CardTitle>Sac vendu</CardTitle>
              <CardDescription>
                {bag.reference}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                {bag.photos && bag.photos.length > 0 ? (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                    <Image
                      src={bag.photos[0]}
                      alt={`${bag.brand} ${bag.model}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-lg font-semibold">{bag.brand}</p>
                  <p className="text-muted-foreground">{bag.model}</p>
                  {bag.color && (
                    <p className="text-sm text-muted-foreground">Couleur: {bag.color}</p>
                  )}
                </div>
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">{bag.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Sale Info */}
        <Card>
          <CardHeader>
            <CardTitle>Details de la vente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Prix de vente</p>
                <p className="text-xl font-bold">
                  {sale.salePrice.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plateforme</p>
                <p className="font-medium">
                  {PLATFORMS[sale.salePlatform as keyof typeof PLATFORMS] || sale.salePlatform}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Compte bancaire</p>
                <p className="font-medium">{sale.bankAccountId?.label || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendu par</p>
                <p className="font-medium">{sale.soldBy?.name || "-"}</p>
              </div>
            </div>
            {sale.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="mt-1">{sale.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Margin Breakdown */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Decomposition de la marge</CardTitle>
            <CardDescription>
              Detail des couts et revenus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Revenue */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-600">Revenus</h4>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Prix de vente</span>
                    <span className="font-medium text-green-600">
                      +{sale.salePrice.toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 font-semibold">
                    <span>Total revenus</span>
                    <span className="text-green-600">
                      {sale.salePrice.toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </span>
                  </div>
                </div>

                {/* Costs */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-red-600">Couts</h4>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Prix d&apos;achat</span>
                    <span className="font-medium text-red-600">
                      -{bag?.purchasePrice?.toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      }) || "0,00 €"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Remise en etat</span>
                    <span className="font-medium text-red-600">
                      -{(bag?.refurbishmentCost || 0).toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Frais plateforme</span>
                    <span className="font-medium text-red-600">
                      -{(sale.platformFees || 0).toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Frais expedition</span>
                    <span className="font-medium text-red-600">
                      -{(sale.shippingCost || 0).toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 font-semibold">
                    <span>Total couts</span>
                    <span className="text-red-600">
                      {((bag?.purchasePrice || 0) + (bag?.refurbishmentCost || 0) + (sale.platformFees || 0) + (sale.shippingCost || 0)).toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Final Margin */}
              <div className="flex justify-between items-center py-4 bg-muted/50 rounded-lg px-4">
                <span className="text-lg font-semibold">Marge nette</span>
                <span className={`text-2xl font-bold ${sale.margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {sale.margin >= 0 ? "+" : ""}
                  {sale.margin.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  })}
                  <span className="text-base ml-2">
                    ({sale.marginPercent.toFixed(1)}%)
                  </span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="flex justify-between text-sm text-muted-foreground">
              <p>
                Enregistre le {new Date(sale.createdAt).toLocaleDateString("fr-FR")} a{" "}
                {new Date(sale.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p>
                Derniere modification : {new Date(sale.updatedAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
