import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db/mongodb";
import { User } from "@/lib/db/models";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caracteres"),
  name: z.string().min(1, "Nom est requis"),
  role: z.enum(["admin", "seller"]),
});

// GET all users (admin only)
export async function GET() {
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

    await dbConnect();

    const users = await User.find().sort({ name: 1 }).select("-password");

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des utilisateurs" },
      { status: 500 }
    );
  }
}

// POST create new user (admin only)
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
    const validatedData = createUserSchema.parse(body);

    await dbConnect();

    // Check if email already exists
    const existing = await User.findOne({ email: validatedData.email });
    if (existing) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe deja" },
        { status: 400 }
      );
    }

    const user = await User.create(validatedData);

    // Return user without password
    const userResponse = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    return NextResponse.json(userResponse, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation de l'utilisateur" },
      { status: 500 }
    );
  }
}
