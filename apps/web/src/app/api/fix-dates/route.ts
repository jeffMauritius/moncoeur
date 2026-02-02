import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { Bag, Sale } from "@/lib/db/models";

export const dynamic = "force-dynamic";

// This is a one-time migration endpoint - no auth required
// Delete this file after running the fix

// Fix dates - set all sales to 31/12/2025
export async function POST() {
  try {
    await dbConnect();

    const targetDate = new Date("2025-12-31");

    // Update all sales dates to 31/12/2025
    const salesResult = await Sale.updateMany(
      {},
      { $set: { saleDate: targetDate } }
    );

    // Also update purchase dates for sold bags to 31/12/2025
    const bagsResult = await Bag.updateMany(
      { status: "vendu" },
      { $set: { purchaseDate: targetDate } }
    );

    return NextResponse.json({
      message: "Dates fixed successfully",
      salesUpdated: salesResult.modifiedCount,
      bagsUpdated: bagsResult.modifiedCount,
    });
  } catch (error) {
    console.error("Fix dates error:", error);
    return NextResponse.json(
      { error: "Failed to fix dates", details: (error as Error).message },
      { status: 500 }
    );
  }
}
