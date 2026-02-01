import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db/mongodb";
import { Sale, Bag } from "@/lib/db/models";

// GET single sale
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

    const sale = await Sale.findById(id)
      .populate({
        path: "bagId",
        select: "reference brand model photos purchasePrice refurbishmentCost condition",
        populate: { path: "purchaseBankAccountId", select: "label" },
      })
      .populate("bankAccountId", "label")
      .populate("soldBy", "name");

    if (!sale) {
      return NextResponse.json(
        { error: "Vente non trouvee" },
        { status: 404 }
      );
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error("Error fetching sale:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation de la vente" },
      { status: 500 }
    );
  }
}

// DELETE sale (also reset bag status)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    // Only admins can delete sales
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent supprimer des ventes" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await dbConnect();

    const sale = await Sale.findById(id);
    if (!sale) {
      return NextResponse.json(
        { error: "Vente non trouvee" },
        { status: 404 }
      );
    }

    // Reset bag status to "en_vente"
    await Bag.findByIdAndUpdate(sale.bagId, { status: "en_vente" });

    // Delete the sale
    await Sale.findByIdAndDelete(id);

    return NextResponse.json({ message: "Vente supprimee avec succes" });
  } catch (error) {
    console.error("Error deleting sale:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la vente" },
      { status: 500 }
    );
  }
}
