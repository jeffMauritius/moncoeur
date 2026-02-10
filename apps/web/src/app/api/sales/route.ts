import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db/mongodb";
import { Sale, Bag, User } from "@/lib/db/models";
import { z } from "zod";
import { sendEmail, saleNotificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const createSaleSchema = z.object({
  bagId: z.string().min(1, "Sac est requis"),
  saleDate: z.string().transform((str) => new Date(str)),
  salePrice: z.number().min(0, "Le prix ne peut pas etre negatif"),
  salePlatform: z.enum(["vinted", "vestiaire_collectif", "leboncoin", "autre"]),
  platformFees: z.number().min(0).optional().default(0),
  shippingCost: z.number().min(0).optional().default(0),
  bankAccountId: z.string().min(1, "Compte bancaire est requis"),
  notes: z.string().optional(),
});

// GET all sales
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const bankAccountId = searchParams.get("bankAccountId");
    const platform = searchParams.get("platform");
    const brand = searchParams.get("brand");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build query
    const query: Record<string, unknown> = {};

    if (bankAccountId && bankAccountId !== "all") {
      query.bankAccountId = bankAccountId;
    }

    if (platform && platform !== "all") {
      query.salePlatform = platform;
    }

    if (brand && brand !== "all") {
      const matchingBags = await Bag.find({ brand }).select("_id").lean();
      query.bagId = { $in: matchingBags.map((b) => b._id) };
    }

    // Date range filter
    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) {
        (query.saleDate as Record<string, Date>).$gte = new Date(startDate);
      }
      if (endDate) {
        // Add one day to include the end date fully
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        (query.saleDate as Record<string, Date>).$lt = end;
      }
    }

    const [sales, total] = await Promise.all([
      Sale.find(query)
        .sort({ saleDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "bagId",
          select: "reference brand model photos purchasePrice refurbishmentCost",
        })
        .populate("bankAccountId", "label")
        .populate("soldBy", "name"),
      Sale.countDocuments(query),
    ]);

    return NextResponse.json({
      sales,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des ventes" },
      { status: 500 }
    );
  }
}

// POST create new sale
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSaleSchema.parse(body);

    await dbConnect();

    // Check if bag exists and is not already sold
    const bag = await Bag.findById(validatedData.bagId);
    if (!bag) {
      return NextResponse.json(
        { error: "Sac non trouve" },
        { status: 404 }
      );
    }

    if (bag.status === "vendu") {
      return NextResponse.json(
        { error: "Ce sac a deja ete vendu" },
        { status: 400 }
      );
    }

    // Check if sale already exists for this bag
    const existingSale = await Sale.findOne({ bagId: validatedData.bagId });
    if (existingSale) {
      return NextResponse.json(
        { error: "Une vente existe deja pour ce sac" },
        { status: 400 }
      );
    }

    // Calculate margin
    const totalCost = bag.purchasePrice + (bag.refurbishmentCost || 0);
    const totalFees = (validatedData.platformFees || 0) + (validatedData.shippingCost || 0);
    const margin = validatedData.salePrice - totalCost - totalFees;
    const marginPercent = totalCost > 0 ? (margin / totalCost) * 100 : 0;

    const sale = await Sale.create({
      ...validatedData,
      margin,
      marginPercent,
      soldBy: session.user.id,
    });

    // Update bag status to "vendu"
    await Bag.findByIdAndUpdate(validatedData.bagId, { status: "vendu" });

    // Populate the created sale
    await sale.populate("bagId", "reference brand model photos");
    await sale.populate("bankAccountId", "label");
    await sale.populate("soldBy", "name");

    // Send email notification to admins
    try {
      const admins = await User.find({ role: "admin", isActive: true }).select("email");
      const adminEmails = admins.map((admin) => admin.email);

      if (adminEmails.length > 0) {
        const emailOptions = saleNotificationEmail({
          bagReference: bag.reference,
          bagBrand: bag.brand,
          bagModel: bag.model,
          salePrice: sale.salePrice,
          margin: sale.margin,
          marginPercent: sale.marginPercent,
          soldByName: session.user.name || "Utilisateur",
        });
        emailOptions.to = adminEmails;
        await sendEmail(emailOptions);
      }
    } catch (emailError) {
      console.error("Error sending notification email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation de la vente" },
      { status: 500 }
    );
  }
}
