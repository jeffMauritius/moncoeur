import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db/mongodb";
import { Bag, Sale } from "@/lib/db/models";
import { z } from "zod";

const updateBagSchema = z.object({
  brand: z.string().min(1, "Marque est requise").optional(),
  model: z.string().min(1, "Modele est requis").optional(),
  description: z.string().min(1, "Description est requise").optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  condition: z.enum(["neuf_etiquette", "neuf_sans_etiquette", "tres_bon", "bon", "correct"]).optional(),
  purchaseDate: z.string().transform((str) => new Date(str)).optional(),
  purchasePrice: z.number().min(0, "Le prix ne peut pas etre negatif").optional(),
  purchasePlatform: z.enum(["vinted", "vestiaire_collectif", "autre"]).optional(),
  purchaseBankAccountId: z.string().optional(),
  refurbishmentCost: z.number().min(0).optional(),
  refurbishmentProvider: z.string().optional(),
  refurbishmentNotes: z.string().optional(),
  saleDate: z.string().transform((str) => new Date(str)).optional(),
  salePrice: z.number().min(0).optional(),
  salePlatform: z.enum(["vinted", "vestiaire_collectif", "leboncoin", "autre"]).optional(),
  saleNotes: z.string().optional(),
  photos: z.array(z.string()).optional(),
  status: z.enum([
    "en_commande",
    "en_transit",
    "recu",
    "en_remise_en_etat",
    "pret_a_vendre",
    "en_vente",
    "vendu",
  ]).optional(),
});

// GET single bag
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

    const bag = await Bag.findById(id)
      .populate("purchaseBankAccountId", "label")
      .populate("createdBy", "name");

    if (!bag) {
      return NextResponse.json(
        { error: "Sac non trouve" },
        { status: 404 }
      );
    }

    return NextResponse.json(bag);
  } catch (error) {
    console.error("Error fetching bag:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation du sac" },
      { status: 500 }
    );
  }
}

// PUT update bag
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateBagSchema.parse(body);

    await dbConnect();

    // Check if bag exists
    const existingBag = await Bag.findById(id);
    if (!existingBag) {
      return NextResponse.json(
        { error: "Sac non trouve" },
        { status: 404 }
      );
    }

    // Check if status is being changed from "vendu" to another status
    const isBeingUnsold = existingBag.status === "vendu" && validatedData.status && validatedData.status !== "vendu";

    // Check if status is being changed to "vendu"
    const isBeingSold = validatedData.status === "vendu" && existingBag.status !== "vendu";

    // If being sold, check if sale info is available
    if (isBeingSold) {
      const salePrice = validatedData.salePrice ?? existingBag.salePrice;
      const salePlatform = validatedData.salePlatform ?? existingBag.salePlatform;

      if (!salePrice || !salePlatform) {
        return NextResponse.json(
          { error: "Veuillez renseigner le prix de vente et la plateforme avant de marquer comme vendu" },
          { status: 400 }
        );
      }
    }

    const bag = await Bag.findByIdAndUpdate(
      id,
      validatedData,
      { new: true, runValidators: true }
    )
      .populate("purchaseBankAccountId", "label")
      .populate("createdBy", "name");

    // Delete sale automatically when status changes from "vendu" to another status
    if (isBeingUnsold) {
      await Sale.findOneAndDelete({ bagId: id });
    }

    // Update existing sale when bag is already sold and stays sold
    const isStillSold = !isBeingSold && !isBeingUnsold && existingBag.status === "vendu" && (!validatedData.status || validatedData.status === "vendu");
    if (isStillSold && bag) {
      const saleUpdateData: Record<string, unknown> = {};
      if (validatedData.saleDate !== undefined) saleUpdateData.saleDate = validatedData.saleDate;
      if (validatedData.salePrice !== undefined) {
        saleUpdateData.salePrice = validatedData.salePrice;
        const totalCost = bag.purchasePrice + (bag.refurbishmentCost || 0);
        saleUpdateData.margin = validatedData.salePrice - totalCost;
        saleUpdateData.marginPercent = totalCost > 0 ? ((validatedData.salePrice - totalCost) / totalCost) * 100 : 0;
      }
      if (validatedData.salePlatform !== undefined) saleUpdateData.salePlatform = validatedData.salePlatform;
      if (validatedData.saleNotes !== undefined) saleUpdateData.notes = validatedData.saleNotes;

      if (Object.keys(saleUpdateData).length > 0) {
        await Sale.findOneAndUpdate({ bagId: id }, saleUpdateData);
      }
    }

    // Create sale automatically when status changes to "vendu"
    if (isBeingSold && bag) {
      const existingSale = await Sale.findOne({ bagId: id });
      if (!existingSale) {
        const salePrice = bag.salePrice!;
        const salePlatform = bag.salePlatform!;
        const bankAccountId = bag.purchaseBankAccountId;

        // Calculate margin
        const totalCost = bag.purchasePrice + (bag.refurbishmentCost || 0);
        const margin = salePrice - totalCost;
        const marginPercent = totalCost > 0 ? (margin / totalCost) * 100 : 0;

        await Sale.create({
          bagId: id,
          saleDate: bag.saleDate || new Date(),
          salePrice,
          salePlatform,
          platformFees: 0,
          shippingCost: 0,
          bankAccountId,
          margin,
          marginPercent,
          notes: bag.saleNotes || "",
          soldBy: session.user.id,
        });
      }
    }

    return NextResponse.json(bag);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error updating bag:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour du sac" },
      { status: 500 }
    );
  }
}

// DELETE bag
export async function DELETE(
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

    // Check if bag has a sale
    const sale = await Sale.findOne({ bagId: id });
    if (sale) {
      return NextResponse.json(
        { error: "Ce sac a ete vendu. Supprimez d'abord la vente." },
        { status: 400 }
      );
    }

    const bag = await Bag.findByIdAndDelete(id);

    if (!bag) {
      return NextResponse.json(
        { error: "Sac non trouve" },
        { status: 404 }
      );
    }

    // TODO: Delete photos from Vercel Blob

    return NextResponse.json({ message: "Sac supprime avec succes" });
  } catch (error) {
    console.error("Error deleting bag:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du sac" },
      { status: 500 }
    );
  }
}
