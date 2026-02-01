import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import path from "path";
import dbConnect from "@/lib/db/mongodb";
import { User, BankAccount, Bag, Sale } from "@/lib/db/models";

export const dynamic = "force-dynamic";

// Helper to convert Excel serial date to JS Date
function excelDateToJSDate(serial: number): Date {
  // Excel dates start from January 1, 1900
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  return new Date(utcValue * 1000);
}

// Helper to parse date from various formats
function parseDate(value: unknown): Date {
  if (typeof value === "number") {
    // Excel serial date (e.g., 46031)
    if (value > 40000) {
      return excelDateToJSDate(value);
    }
    // Date as number like 270524 (27/05/24)
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
    "vuitton": "Louis Vuitton",
    "chanel": "Chanel",
    "hermes": "Hermes",
    "hermès": "Hermes",
    "gucci": "Gucci",
    "dior": "Dior",
    "prada": "Prada",
    "burberry": "Burberry",
    "lancel": "Lancel",
    "longchamp": "Longchamp",
    "maje": "Maje",
    "sandro": "Sandro",
    "sezane": "Sezane",
    "sézane": "Sezane",
    "celine": "Celine",
    "céline": "Celine",
    "chloe": "Chloe",
    "chloé": "Chloe",
    "see by chloe": "See by Chloe",
    "balenciaga": "Balenciaga",
    "fossil": "Fossil",
    "marc jacobs": "Marc Jacobs",
    "michael kors": "Michael Kors",
    "coach": "Coach",
    "furla": "Furla",
    "gerard darel": "Gerard Darel",
    "gerad darel": "Gerard Darel",
    "darel": "Gerard Darel",
    "brigitte bardot": "Brigitte Bardot",
    "charli": "Charli",
  };

  for (const [key, brandName] of Object.entries(brands)) {
    if (desc.includes(key)) {
      return { brand: brandName, model: description };
    }
  }

  return { brand: "Autre", model: description };
}

export async function POST() {
  try {
    await dbConnect();

    // Check if already seeded
    const existingBags = await Bag.countDocuments();
    if (existingBags > 0) {
      return NextResponse.json(
        { message: "Database already has data. Delete existing data first." },
        { status: 400 }
      );
    }

    // Read Excel file
    const filePath = path.join(process.cwd(), "data", "ventes.xlsx");
    const workbook = XLSX.readFile(filePath);

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
    const bankAccounts: Record<string, typeof BankAccount.prototype> = {};

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
      bankAccounts[name.toLowerCase()] = account;
    }

    const stats = {
      bags: 0,
      sales: 0,
      errors: [] as string[],
    };

    // Import purchases from "achats" sheet as bags
    const achatsSheet = workbook.Sheets["achats"];
    if (achatsSheet) {
      const achatsData = XLSX.utils.sheet_to_json<{
        date: number;
        descriptif: string;
        prix: number;
      }>(achatsSheet);

      for (let i = 0; i < achatsData.length; i++) {
        const row = achatsData[i];
        if (!row.descriptif || !row.prix) continue;

        try {
          const { brand, model } = extractBrand(row.descriptif);
          const purchaseDate = parseDate(row.date);

          await Bag.create({
            brand,
            model,
            description: row.descriptif,
            condition: "bon",
            purchaseDate,
            purchasePrice: row.prix,
            purchasePlatform: "vinted",
            purchaseBankAccountId: bankAccounts["beatrice"]._id,
            refurbishmentCost: 0,
            status: "en_vente",
            createdBy: adminUser._id,
          });
          stats.bags++;
        } catch (error) {
          stats.errors.push(`Achats row ${i + 1}: ${(error as Error).message}`);
        }
      }
    }

    // Helper to import sales from a sheet
    async function importSales(
      sheetName: string,
      bankAccountKey: string,
      columns: { name: number; purchase: number; sale: number; fees?: number }
    ) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) return;

      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1 }) as unknown[][];

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[columns.name] || !row[columns.sale]) continue;

        try {
          const description = String(row[columns.name]);
          const purchasePrice = Number(row[columns.purchase]) || 0;
          const salePrice = Number(row[columns.sale]) || 0;
          const fees = columns.fees !== undefined ? Number(row[columns.fees]) || 0 : 0;

          if (salePrice <= 0) continue;

          const { brand, model } = extractBrand(description);

          // Create bag (sold)
          const bag = await Bag.create({
            brand,
            model,
            description,
            condition: "bon",
            purchaseDate: new Date(),
            purchasePrice,
            purchasePlatform: "vinted",
            purchaseBankAccountId: bankAccounts[bankAccountKey]._id,
            refurbishmentCost: fees,
            status: "vendu",
            createdBy: adminUser._id,
          });
          stats.bags++;

          // Create sale
          const margin = salePrice - purchasePrice - fees;
          const marginPercent = purchasePrice > 0 ? (margin / purchasePrice) * 100 : 0;

          await Sale.create({
            bagId: bag._id,
            saleDate: new Date(),
            salePrice,
            salePlatform: "vinted",
            platformFees: 0,
            shippingCost: 0,
            bankAccountId: bankAccounts[bankAccountKey]._id,
            margin,
            marginPercent,
            soldBy: adminUser._id,
          });
          stats.sales++;
        } catch (error) {
          stats.errors.push(`${sheetName} row ${i + 1}: ${(error as Error).message}`);
        }
      }
    }

    // Import sales from beatrice (columns: 0=name, 1=purchase, 2=sale, 3=fees)
    await importSales("beatrice", "beatrice", { name: 0, purchase: 1, sale: 2, fees: 3 });

    // Import sales from goergio (columns: 0=name, 1=purchase, 2=sale, 3=fees)
    await importSales("goergio", "goergio", { name: 0, purchase: 1, sale: 2, fees: 3 });

    // Import from historique (columns: 0=date, 1=name, 2=purchase, 3=sale)
    const historiqueSheet = workbook.Sheets["historique"];
    if (historiqueSheet) {
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(historiqueSheet, { header: 1 }) as unknown[][];

      for (let i = 1; i < Math.min(data.length, 200); i++) { // Limit to first 200
        const row = data[i];
        if (!row || !row[1] || !row[3]) continue;

        try {
          const saleDate = parseDate(row[0]);
          const description = String(row[1]);
          const purchasePrice = Number(row[2]) || 0;
          const salePrice = Number(row[3]) || 0;

          if (salePrice <= 0) continue;

          const { brand, model } = extractBrand(description);

          // Create bag (sold)
          const bag = await Bag.create({
            brand,
            model,
            description,
            condition: "bon",
            purchaseDate: saleDate,
            purchasePrice,
            purchasePlatform: "vinted",
            purchaseBankAccountId: bankAccounts["beatrice"]._id,
            refurbishmentCost: 0,
            status: "vendu",
            createdBy: adminUser._id,
          });
          stats.bags++;

          // Create sale
          const margin = salePrice - purchasePrice;
          const marginPercent = purchasePrice > 0 ? (margin / purchasePrice) * 100 : 0;

          await Sale.create({
            bagId: bag._id,
            saleDate,
            salePrice,
            salePlatform: "vinted",
            platformFees: 0,
            shippingCost: 0,
            bankAccountId: bankAccounts["beatrice"]._id,
            margin,
            marginPercent,
            soldBy: adminUser._id,
          });
          stats.sales++;
        } catch (error) {
          stats.errors.push(`Historique row ${i + 1}: ${(error as Error).message}`);
        }
      }
    }

    return NextResponse.json({
      message: "Database seeded successfully from Excel",
      stats: {
        bagsCreated: stats.bags,
        salesCreated: stats.sales,
        errors: stats.errors.slice(0, 10), // Show first 10 errors
        totalErrors: stats.errors.length,
      },
    });
  } catch (error) {
    console.error("Seed Excel error:", error);
    return NextResponse.json(
      { error: "Failed to seed database", details: (error as Error).message },
      { status: 500 }
    );
  }
}
