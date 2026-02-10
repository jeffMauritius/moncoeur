import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db/mongodb";
import { BankAccount, Sale } from "@/lib/db/models";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createBankAccountSchema = z.object({
  label: z.string().min(1, "Libelle est requis"),
  description: z.string().optional(),
});

// GET all bank accounts
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    await dbConnect();

    const bankAccounts = await BankAccount.find()
      .sort({ label: 1 })
      .lean();

    // Aggregate current year revenue per bank account
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear() + 1, 0, 1);

    const revenueAgg = await Sale.aggregate([
      { $match: { saleDate: { $gte: yearStart, $lt: yearEnd } } },
      { $group: { _id: "$bankAccountId", revenue: { $sum: "$salePrice" } } },
    ]);

    const revenueMap = new Map(
      revenueAgg.map((r: { _id: string; revenue: number }) => [r._id.toString(), r.revenue])
    );

    const result = bankAccounts.map((a: Record<string, unknown>) => ({
      ...a,
      revenue: revenueMap.get((a._id as { toString(): string }).toString()) || 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des comptes" },
      { status: 500 }
    );
  }
}

// POST create new bank account (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Acces reserve aux administrateurs" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createBankAccountSchema.parse(body);

    await dbConnect();

    // Check if label already exists
    const existing = await BankAccount.findOne({ label: validatedData.label });
    if (existing) {
      return NextResponse.json(
        { error: "Un compte avec ce libelle existe deja" },
        { status: 400 }
      );
    }

    const bankAccount = await BankAccount.create({
      ...validatedData,
      createdBy: session.user.id,
    });

    return NextResponse.json(bankAccount, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating bank account:", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation du compte" },
      { status: 500 }
    );
  }
}
