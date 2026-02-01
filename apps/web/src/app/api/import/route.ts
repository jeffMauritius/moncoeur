import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db/mongodb";
import { Bag, Sale, BankAccount } from "@/lib/db/models";
import * as XLSX from "xlsx";

interface ImportResult {
  success: boolean;
  bagsCreated: number;
  salesCreated: number;
  bankAccountsCreated: number;
  errors: string[];
}

// POST import Excel file
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    // Check if user is admin
    if ((session.user as { role?: string }).role !== "admin") {
      return NextResponse.json(
        { error: "Acces reserve aux administrateurs" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    }

    await dbConnect();

    // Read Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    const result: ImportResult = {
      success: true,
      bagsCreated: 0,
      salesCreated: 0,
      bankAccountsCreated: 0,
      errors: [],
    };

    // Map of bank account names to their IDs
    const bankAccountMap: Record<string, string> = {};

    // Create bank accounts based on sheet names
    const bankAccountNames = ["beatrice", "tiziana", "goergio", "jenacha"];
    for (const name of bankAccountNames) {
      const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

      // Check if exists
      let bankAccount = await BankAccount.findOne({
        label: { $regex: new RegExp(`^${capitalizedName}$`, "i") },
      });

      if (!bankAccount) {
        bankAccount = await BankAccount.create({
          label: capitalizedName,
          description: `Compte importe depuis Excel`,
          isActive: true,
          createdBy: session.user.id,
        });
        result.bankAccountsCreated++;
      }

      bankAccountMap[name.toLowerCase()] = bankAccount._id.toString();
    }

    // Also create a default "Non specifie" account for purchases without specified account
    let defaultAccount = await BankAccount.findOne({ label: "Non specifie" });
    if (!defaultAccount) {
      defaultAccount = await BankAccount.create({
        label: "Non specifie",
        description: "Compte par defaut pour les achats sans compte specifie",
        isActive: true,
        createdBy: session.user.id,
      });
      result.bankAccountsCreated++;
    }
    bankAccountMap["default"] = defaultAccount._id.toString();

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, unknown>[];

      const lowerSheetName = sheetName.toLowerCase();

      if (lowerSheetName === "achats") {
        // Process purchases - create bags
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          try {
            const descriptif = String(row["descriptif"] || row["Descriptif"] || row["DESCRIPTIF"] || "");
            const prix = parseFloat(String(row["prix"] || row["Prix"] || row["PRIX"] || "0").replace(",", ".")) || 0;
            const dateStr = row["date"] || row["Date"] || row["DATE"];

            if (!descriptif || prix === 0) continue;

            // Try to extract brand from description
            const { brand, model } = extractBrandAndModel(descriptif);

            // Parse date
            let purchaseDate = new Date();
            if (dateStr) {
              if (typeof dateStr === "number") {
                // Excel date serial number
                purchaseDate = excelDateToJSDate(dateStr);
              } else {
                const parsedDate = new Date(String(dateStr));
                if (!isNaN(parsedDate.getTime())) {
                  purchaseDate = parsedDate;
                }
              }
            }

            // Check if bag with similar description already exists
            const existingBag = await Bag.findOne({
              description: { $regex: new RegExp(descriptif.substring(0, 50), "i") },
            });

            if (existingBag) continue;

            await Bag.create({
              brand,
              model,
              description: descriptif,
              condition: "tres_bon",
              purchaseDate,
              purchasePrice: prix,
              purchasePlatform: "autre",
              purchaseBankAccountId: bankAccountMap["default"],
              refurbishmentCost: 0,
              photos: [],
              status: "recu",
              createdBy: session.user.id,
            });

            result.bagsCreated++;
          } catch (error) {
            result.errors.push(`Ligne ${i + 2} (achats): ${(error as Error).message}`);
          }
        }
      } else if (bankAccountNames.includes(lowerSheetName)) {
        // Process sales sheets (beatrice, tiziana, goergio, jenacha)
        const bankAccountId = bankAccountMap[lowerSheetName];

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          try {
            const descriptif = String(row["descriptif"] || row["Descriptif"] || row["DESCRIPTIF"] || "");
            const prixAchat = parseFloat(String(row["prix achat"] || row["Prix achat"] || row["PRIX ACHAT"] || "0").replace(",", ".")) || 0;
            const prixVente = parseFloat(String(row["prix vente"] || row["Prix vente"] || row["PRIX VENTE"] || "0").replace(",", ".")) || 0;
            const fraisGianni = parseFloat(String(row["frais gianni"] || row["Frais gianni"] || row["FRAIS GIANNI"] || row["frais"] || row["Frais"] || "0").replace(",", ".")) || 0;

            if (!descriptif || prixVente === 0) continue;

            const { brand, model } = extractBrandAndModel(descriptif);

            // Create bag
            const bag = await Bag.create({
              brand,
              model,
              description: descriptif,
              condition: "tres_bon",
              purchaseDate: new Date(),
              purchasePrice: prixAchat,
              purchasePlatform: "autre",
              purchaseBankAccountId: bankAccountId,
              refurbishmentCost: fraisGianni,
              refurbishmentProvider: fraisGianni > 0 ? "Gianni" : undefined,
              photos: [],
              status: "vendu",
              createdBy: session.user.id,
            });

            result.bagsCreated++;

            // Create sale
            const margin = prixVente - prixAchat - fraisGianni;
            const marginPercent = prixAchat > 0 ? (margin / prixAchat) * 100 : 0;

            await Sale.create({
              bagId: bag._id,
              saleDate: new Date(),
              salePrice: prixVente,
              salePlatform: "autre",
              platformFees: 0,
              shippingCost: 0,
              bankAccountId,
              margin,
              marginPercent,
              soldBy: session.user.id,
            });

            result.salesCreated++;
          } catch (error) {
            result.errors.push(`Ligne ${i + 2} (${sheetName}): ${(error as Error).message}`);
          }
        }
      } else if (lowerSheetName === "historique") {
        // Process historique sheet
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          try {
            const descriptif = String(row["achats libelle"] || row["Achats libelle"] || row["descriptif"] || "");
            const prixAchat = parseFloat(String(row["prix achats"] || row["Prix achats"] || row["prix achat"] || "0").replace(",", ".")) || 0;
            const prixVente = parseFloat(String(row["prix vente"] || row["Prix vente"] || "0").replace(",", ".")) || 0;

            if (!descriptif || prixVente === 0) continue;

            const { brand, model } = extractBrandAndModel(descriptif);

            // Create bag
            const bag = await Bag.create({
              brand,
              model,
              description: descriptif,
              condition: "tres_bon",
              purchaseDate: new Date(),
              purchasePrice: prixAchat,
              purchasePlatform: "autre",
              purchaseBankAccountId: bankAccountMap["default"],
              refurbishmentCost: 0,
              photos: [],
              status: "vendu",
              createdBy: session.user.id,
            });

            result.bagsCreated++;

            // Create sale
            const margin = prixVente - prixAchat;
            const marginPercent = prixAchat > 0 ? (margin / prixAchat) * 100 : 0;

            await Sale.create({
              bagId: bag._id,
              saleDate: new Date(),
              salePrice: prixVente,
              salePlatform: "autre",
              platformFees: 0,
              shippingCost: 0,
              bankAccountId: bankAccountMap["default"],
              margin,
              marginPercent,
              soldBy: session.user.id,
            });

            result.salesCreated++;
          } catch (error) {
            result.errors.push(`Ligne ${i + 2} (historique): ${(error as Error).message}`);
          }
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'import", details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Helper function to extract brand and model from description
function extractBrandAndModel(description: string): { brand: string; model: string } {
  const brands = [
    "Lancel",
    "Longchamp",
    "Louis Vuitton",
    "LV",
    "Chanel",
    "Hermes",
    "Burberry",
    "Maje",
    "Gerard Darel",
    "See by Chloe",
    "Celine",
    "Balenciaga",
    "Fossil",
    "Sezane",
    "Brigitte Bardot",
    "Michael Kors",
    "Coach",
    "Guess",
    "Lancaster",
    "Furla",
  ];

  const lowerDesc = description.toLowerCase();

  for (const brand of brands) {
    if (lowerDesc.includes(brand.toLowerCase())) {
      // Remove brand from description to get model
      const model = description
        .replace(new RegExp(brand, "gi"), "")
        .replace(/^[\s-]+|[\s-]+$/g, "")
        .trim();

      return {
        brand: brand === "LV" ? "Louis Vuitton" : brand,
        model: model || "Non specifie",
      };
    }
  }

  return {
    brand: "Autre",
    model: description.substring(0, 100),
  };
}

// Helper function to convert Excel date serial to JS Date
function excelDateToJSDate(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  return new Date(utcValue * 1000);
}
