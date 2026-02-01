import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { User, BankAccount } from "@/lib/db/models";

// This endpoint should be called once to seed the database
// In production, you should protect or remove this endpoint

export async function POST() {
  try {
    await dbConnect();

    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      return NextResponse.json(
        { message: "Database already seeded" },
        { status: 400 }
      );
    }

    // Create users
    const users = await User.create([
      {
        email: "nadia@moncoeur.app",
        password: "nadia123", // Will be hashed by the model
        name: "Nadia",
        role: "admin",
        isActive: true,
      },
      {
        email: "jeff@moncoeur.app",
        password: "jeff123", // Will be hashed by the model
        name: "Jeff",
        role: "admin",
        isActive: true,
      },
      {
        email: "jeannette@moncoeur.app",
        password: "jeannette123", // Will be hashed by the model
        name: "Jeannette",
        role: "seller",
        isActive: true,
      },
    ]);

    // Create bank accounts based on Excel data
    const adminUser = users[0];
    await BankAccount.create([
      {
        label: "Beatrice",
        description: "Compte Beatrice",
        isActive: true,
        createdBy: adminUser._id,
      },
      {
        label: "Tiziana",
        description: "Compte Tiziana",
        isActive: true,
        createdBy: adminUser._id,
      },
      {
        label: "Goergio",
        description: "Compte Goergio",
        isActive: true,
        createdBy: adminUser._id,
      },
      {
        label: "Jenacha",
        description: "Compte Jenacha",
        isActive: true,
        createdBy: adminUser._id,
      },
    ]);

    return NextResponse.json({
      message: "Database seeded successfully",
      users: users.map((u) => ({ email: u.email, name: u.name, role: u.role })),
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    );
  }
}
