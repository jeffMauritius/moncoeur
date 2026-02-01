import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db/mongodb";
import { Bag, User } from "@/lib/db/models";
import { z } from "zod";
import { sendEmail, newBagNotificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const createBagSchema = z.object({
  brand: z.string().min(1, "Marque est requise"),
  model: z.string().min(1, "Modele est requis"),
  description: z.string().min(1, "Description est requise"),
  color: z.string().optional(),
  size: z.string().optional(),
  condition: z.enum(["neuf_etiquette", "neuf_sans_etiquette", "tres_bon", "bon", "correct"]),
  purchaseDate: z.string().transform((str) => new Date(str)),
  purchasePrice: z.number().min(0, "Le prix ne peut pas etre negatif"),
  purchasePlatform: z.enum(["vinted", "vestiaire_collectif", "autre"]),
  purchaseBankAccountId: z.string().min(1, "Compte bancaire est requis"),
  refurbishmentCost: z.number().min(0).optional().default(0),
  refurbishmentProvider: z.string().optional(),
  refurbishmentNotes: z.string().optional(),
  photos: z.array(z.string()).optional().default([]),
  status: z.enum([
    "en_commande",
    "en_transit",
    "recu",
    "en_remise_en_etat",
    "pret_a_vendre",
    "en_vente",
    "vendu",
  ]).optional().default("en_commande"),
});

// GET all bags
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const brand = searchParams.get("brand");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build query
    const query: Record<string, unknown> = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (brand && brand !== "all") {
      query.brand = brand;
    }

    if (search) {
      query.$or = [
        { reference: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const [bags, total] = await Promise.all([
      Bag.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("purchaseBankAccountId", "label")
        .populate("createdBy", "name"),
      Bag.countDocuments(query),
    ]);

    return NextResponse.json({
      bags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching bags:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des sacs" },
      { status: 500 }
    );
  }
}

// POST create new bag
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createBagSchema.parse(body);

    await dbConnect();

    const bag = await Bag.create({
      ...validatedData,
      createdBy: session.user.id,
    });

    // Populate the created bag
    await bag.populate("purchaseBankAccountId", "label");
    await bag.populate("createdBy", "name");

    // Send email notification to admins
    try {
      const admins = await User.find({ role: "admin", isActive: true }).select("email");
      const adminEmails = admins.map((admin) => admin.email);

      if (adminEmails.length > 0) {
        const emailOptions = newBagNotificationEmail({
          reference: bag.reference,
          brand: bag.brand,
          model: bag.model,
          purchasePrice: bag.purchasePrice,
          createdByName: session.user.name || "Utilisateur",
        });
        emailOptions.to = adminEmails;
        await sendEmail(emailOptions);
      }
    } catch (emailError) {
      console.error("Error sending notification email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(bag, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating bag:", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation du sac" },
      { status: 500 }
    );
  }
}
