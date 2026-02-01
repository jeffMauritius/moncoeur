import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db/mongodb";
import { Bag, Sale } from "@/lib/db/models";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "sales";
    const format = searchParams.get("format") || "csv";

    let data: Record<string, unknown>[] = [];
    let headers: string[] = [];
    let filename = "";

    if (type === "sales") {
      const sales = await Sale.find()
        .populate("bagId", "brand model reference purchasePrice refurbishmentCost")
        .populate("bankAccountId", "label")
        .populate("soldBy", "name")
        .sort({ saleDate: -1 })
        .lean();

      headers = [
        "Date",
        "Reference",
        "Marque",
        "Modele",
        "Prix achat",
        "Frais remise en etat",
        "Prix vente",
        "Frais plateforme",
        "Frais expedition",
        "Marge",
        "Marge %",
        "Plateforme",
        "Compte bancaire",
        "Vendeur",
      ];

      data = sales.map((sale) => {
        const bag = sale.bagId as unknown as Record<string, unknown> | null;
        const bankAccount = sale.bankAccountId as unknown as Record<string, unknown> | null;
        const soldBy = sale.soldBy as unknown as Record<string, unknown> | null;

        return {
          Date: new Date(sale.saleDate as Date).toLocaleDateString("fr-FR"),
          Reference: bag?.reference || "",
          Marque: bag?.brand || "",
          Modele: bag?.model || "",
          "Prix achat": bag?.purchasePrice || 0,
          "Frais remise en etat": bag?.refurbishmentCost || 0,
          "Prix vente": sale.salePrice,
          "Frais plateforme": sale.platformFees || 0,
          "Frais expedition": sale.shippingCost || 0,
          Marge: sale.margin,
          "Marge %": `${(sale.marginPercent as number).toFixed(1)}%`,
          Plateforme: sale.salePlatform,
          "Compte bancaire": bankAccount?.label || "",
          Vendeur: soldBy?.name || "",
        };
      });

      filename = `ventes_export_${new Date().toISOString().split("T")[0]}`;
    } else if (type === "stock") {
      const bags = await Bag.find()
        .populate("purchaseBankAccountId", "label")
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .lean();

      headers = [
        "Reference",
        "Marque",
        "Modele",
        "Description",
        "Couleur",
        "Taille",
        "Etat",
        "Date achat",
        "Prix achat",
        "Plateforme achat",
        "Frais remise en etat",
        "Prestataire",
        "Statut",
        "Compte bancaire",
        "Cree par",
      ];

      data = bags.map((bag) => {
        const bankAccount = bag.purchaseBankAccountId as unknown as Record<string, unknown> | null;
        const createdBy = bag.createdBy as unknown as Record<string, unknown> | null;

        return {
          Reference: bag.reference,
          Marque: bag.brand,
          Modele: bag.model,
          Description: bag.description,
          Couleur: bag.color || "",
          Taille: bag.size || "",
          Etat: bag.condition,
          "Date achat": new Date(bag.purchaseDate).toLocaleDateString("fr-FR"),
          "Prix achat": bag.purchasePrice,
          "Plateforme achat": bag.purchasePlatform,
          "Frais remise en etat": bag.refurbishmentCost,
          Prestataire: bag.refurbishmentProvider || "",
          Statut: bag.status,
          "Compte bancaire": bankAccount?.label || "",
          "Cree par": createdBy?.name || "",
        };
      });

      filename = `stock_export_${new Date().toISOString().split("T")[0]}`;
    } else {
      return NextResponse.json({ error: "Type invalide" }, { status: 400 });
    }

    if (format === "csv") {
      // Generate CSV
      const csvRows = [headers.join(";")];
      for (const row of data) {
        const values = headers.map((header) => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains special chars
          const strValue = String(value ?? "");
          if (strValue.includes(";") || strValue.includes('"') || strValue.includes("\n")) {
            return `"${strValue.replace(/"/g, '""')}"`;
          }
          return strValue;
        });
        csvRows.push(values.join(";"));
      }
      const csvContent = csvRows.join("\n");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: "Format non supporte" }, { status: 400 });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
