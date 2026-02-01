import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db/mongodb";
import { User, BankAccount, Bag, Sale } from "@/lib/db/models";
import seedData from "./data.json";

export const dynamic = "force-dynamic";

// Helper to convert Excel serial date to JS Date
function excelDateToJSDate(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  return new Date(utcValue * 1000);
}

// Helper to parse date from various formats
function parseDate(value: unknown): Date {
  if (typeof value === "number") {
    if (value > 40000) {
      return excelDateToJSDate(value);
    }
    const str = String(value).padStart(6, "0");
    const day = parseInt(str.slice(0, 2));
    const month = parseInt(str.slice(2, 4)) - 1;
    const year = 2000 + parseInt(str.slice(4, 6));
    return new Date(year, month, day);
  }
  if (typeof value === "string") {
    return new Date(value);
  }
  return new Date();
}

// Extract brand from description
function extractBrand(description: string): { brand: string; model: string } {
  const desc = description.toLowerCase();

  const brands: Record<string, string> = {
    "louis vuitton": "Louis Vuitton",
    vuitton: "Louis Vuitton",
    chanel: "Chanel",
    hermes: "Hermes",
    hermès: "Hermes",
    gucci: "Gucci",
    dior: "Dior",
    prada: "Prada",
    burberry: "Burberry",
    lancel: "Lancel",
    longchamp: "Longchamp",
    maje: "Maje",
    sandro: "Sandro",
    sezane: "Sezane",
    sézane: "Sezane",
    celine: "Celine",
    céline: "Celine",
    chloe: "Chloe",
    chloé: "Chloe",
    "see by chloe": "See by Chloe",
    balenciaga: "Balenciaga",
    fossil: "Fossil",
    "marc jacobs": "Marc Jacobs",
    "michael kors": "Michael Kors",
    coach: "Coach",
    furla: "Furla",
    "gerard darel": "Gerard Darel",
    "gerad darel": "Gerard Darel",
    darel: "Gerard Darel",
    "brigitte bardot": "Brigitte Bardot",
    charli: "Charli",
  };

  for (const [key, brandName] of Object.entries(brands)) {
    if (desc.includes(key)) {
      return { brand: brandName, model: description };
    }
  }

  return { brand: "Autre", model: description };
}

// Helper to import sales from array data
async function importSalesFromData(
  data: unknown[][],
  sheetName: string,
  bankAccountId: mongoose.Types.ObjectId,
  adminUserId: mongoose.Types.ObjectId,
  columns: { name: number; purchase: number; sale: number; fees?: number },
  stats: { bags: number; sales: number; errors: string[] }
): Promise<void> {
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[columns.name] || !row[columns.sale]) continue;

    try {
      const description = String(row[columns.name]);
      const purchasePrice = Number(row[columns.purchase]) || 0;
      const salePrice = Number(row[columns.sale]) || 0;
      const fees =
        columns.fees !== undefined ? Number(row[columns.fees]) || 0 : 0;

      if (salePrice <= 0) continue;

      const { brand, model } = extractBrand(description);

      bagCounter++;
      const bag = await Bag.create({
        reference: generateReference(bagCounter),
        brand,
        model,
        description,
        condition: "bon",
        purchaseDate: new Date(),
        purchasePrice,
        purchasePlatform: "vinted",
        purchaseBankAccountId: bankAccountId,
        refurbishmentCost: fees,
        status: "vendu",
        createdBy: adminUserId,
      });
      stats.bags++;

      const margin = salePrice - purchasePrice - fees;
      const marginPercent =
        purchasePrice > 0 ? (margin / purchasePrice) * 100 : 0;

      await Sale.create({
        bagId: bag._id,
        saleDate: new Date(),
        salePrice,
        salePlatform: "vinted",
        platformFees: 0,
        shippingCost: 0,
        bankAccountId: bankAccountId,
        margin,
        marginPercent,
        soldBy: adminUserId,
      });
      stats.sales++;
    } catch (error) {
      stats.errors.push(
        `${sheetName} row ${i + 1}: ${(error as Error).message}`
      );
    }
  }
}

// Generate unique reference
function generateReference(index: number): string {
  const year = new Date().getFullYear();
  return `MC-${year}-${String(index).padStart(5, "0")}`;
}

let bagCounter = 0;

export async function POST() {
  try {
    await dbConnect();

    const existingBags = await Bag.countDocuments();
    if (existingBags > 0) {
      return NextResponse.json(
        { message: "Database already has data. Delete existing data first." },
        { status: 400 }
      );
    }

    bagCounter = 0;

    // Create users if they don't exist
    let adminUser = await User.findOne({ email: "nadia@moncoeur.app" });
    if (!adminUser) {
      const users = await User.create([
        {
          email: "nadia@moncoeur.app",
          password: "Test123456!",
          name: "Nadia",
          role: "admin",
          isActive: true,
        },
        {
          email: "jeff@moncoeur.app",
          password: "Test123456!",
          name: "Jeff",
          role: "admin",
          isActive: true,
        },
        {
          email: "jeannette@moncoeur.app",
          password: "Test123456!",
          name: "Jeannette",
          role: "seller",
          isActive: true,
        },
      ]);
      adminUser = users[0];
    }

    // Create bank accounts
    const bankAccountNames = ["Beatrice", "Tiziana", "Goergio", "Jenacha"];
    const bankAccounts: Record<string, mongoose.Types.ObjectId> = {};

    for (const name of bankAccountNames) {
      let account = await BankAccount.findOne({ label: name });
      if (!account) {
        account = await BankAccount.create({
          label: name,
          description: `Compte ${name}`,
          isActive: true,
          createdBy: adminUser._id,
        });
      }
      bankAccounts[name.toLowerCase()] = account._id;
    }

    const stats = {
      bags: 0,
      sales: 0,
      errors: [] as string[],
    };

    // Import purchases from "achats" as bags
    const achatsData = seedData.achats as Array<{
      date: number;
      descriptif: string;
      prix: number;
    }>;

    for (let i = 0; i < achatsData.length; i++) {
      const row = achatsData[i];
      if (!row.descriptif || !row.prix) continue;

      try {
        const { brand, model } = extractBrand(row.descriptif);
        const purchaseDate = parseDate(row.date);

        bagCounter++;
        await Bag.create({
          reference: generateReference(bagCounter),
          brand,
          model,
          description: row.descriptif,
          condition: "bon",
          purchaseDate,
          purchasePrice: row.prix,
          purchasePlatform: "vinted",
          purchaseBankAccountId: bankAccounts["beatrice"],
          refurbishmentCost: 0,
          status: "en_vente",
          createdBy: adminUser._id,
        });
        stats.bags++;
      } catch (error) {
        stats.errors.push(`Achats row ${i + 1}: ${(error as Error).message}`);
      }
    }

    // Import sales from beatrice
    await importSalesFromData(
      seedData.beatrice as unknown[][],
      "beatrice",
      bankAccounts["beatrice"],
      adminUser._id,
      { name: 0, purchase: 1, sale: 2, fees: 3 },
      stats
    );

    // Import sales from goergio
    await importSalesFromData(
      seedData.goergio as unknown[][],
      "goergio",
      bankAccounts["goergio"],
      adminUser._id,
      { name: 0, purchase: 1, sale: 2, fees: 3 },
      stats
    );

    // Import from historique
    const historiqueData = seedData.historique as unknown[][];
    for (let i = 1; i < historiqueData.length; i++) {
      const row = historiqueData[i];
      if (!row || !row[1] || !row[3]) continue;

      try {
        const saleDate = parseDate(row[0]);
        const description = String(row[1]);
        const purchasePrice = Number(row[2]) || 0;
        const salePrice = Number(row[3]) || 0;

        if (salePrice <= 0) continue;

        const { brand, model } = extractBrand(description);

        bagCounter++;
        const bag = await Bag.create({
          reference: generateReference(bagCounter),
          brand,
          model,
          description,
          condition: "bon",
          purchaseDate: saleDate,
          purchasePrice,
          purchasePlatform: "vinted",
          purchaseBankAccountId: bankAccounts["beatrice"],
          refurbishmentCost: 0,
          status: "vendu",
          createdBy: adminUser._id,
        });
        stats.bags++;

        const margin = salePrice - purchasePrice;
        const marginPercent =
          purchasePrice > 0 ? (margin / purchasePrice) * 100 : 0;

        await Sale.create({
          bagId: bag._id,
          saleDate,
          salePrice,
          salePlatform: "vinted",
          platformFees: 0,
          shippingCost: 0,
          bankAccountId: bankAccounts["beatrice"],
          margin,
          marginPercent,
          soldBy: adminUser._id,
        });
        stats.sales++;
      } catch (error) {
        stats.errors.push(
          `Historique row ${i + 1}: ${(error as Error).message}`
        );
      }
    }

    return NextResponse.json({
      message: "Database seeded successfully",
      stats: {
        bagsCreated: stats.bags,
        salesCreated: stats.sales,
        errors: stats.errors.slice(0, 10),
        totalErrors: stats.errors.length,
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed database", details: (error as Error).message },
      { status: 500 }
    );
  }
}
