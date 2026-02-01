import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db/mongodb";
import { BankAccount, Bag, Sale } from "@/lib/db/models";
import { z } from "zod";

const updateBankAccountSchema = z.object({
  label: z.string().min(1, "Libelle est requis").optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET single bank account
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const bankAccount = await BankAccount.findById(id).populate(
      "createdBy",
      "name"
    );

    if (!bankAccount) {
      return NextResponse.json(
        { error: "Compte non trouve" },
        { status: 404 }
      );
    }

    return NextResponse.json(bankAccount);
  } catch (error) {
    console.error("Error fetching bank account:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation du compte" },
      { status: 500 }
    );
  }
}

// PUT update bank account (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateBankAccountSchema.parse(body);

    await dbConnect();

    // Check if new label already exists (if label is being changed)
    if (validatedData.label) {
      const existing = await BankAccount.findOne({
        label: validatedData.label,
        _id: { $ne: id },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Un compte avec ce libelle existe deja" },
          { status: 400 }
        );
      }
    }

    const bankAccount = await BankAccount.findByIdAndUpdate(
      id,
      validatedData,
      { new: true, runValidators: true }
    );

    if (!bankAccount) {
      return NextResponse.json(
        { error: "Compte non trouve" },
        { status: 404 }
      );
    }

    return NextResponse.json(bankAccount);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error updating bank account:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour du compte" },
      { status: 500 }
    );
  }
}

// DELETE bank account (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    await dbConnect();

    // Check if account is used in bags or sales
    const bagsCount = await Bag.countDocuments({ purchaseBankAccountId: id });
    const salesCount = await Sale.countDocuments({ bankAccountId: id });

    if (bagsCount > 0 || salesCount > 0) {
      return NextResponse.json(
        {
          error: `Ce compte est utilise dans ${bagsCount} sac(s) et ${salesCount} vente(s). Impossible de le supprimer.`,
        },
        { status: 400 }
      );
    }

    const bankAccount = await BankAccount.findByIdAndDelete(id);

    if (!bankAccount) {
      return NextResponse.json(
        { error: "Compte non trouve" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Compte supprime avec succes" });
  } catch (error) {
    console.error("Error deleting bank account:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du compte" },
      { status: 500 }
    );
  }
}
