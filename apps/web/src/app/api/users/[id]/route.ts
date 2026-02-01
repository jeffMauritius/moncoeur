import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db/mongodb";
import { User, Bag, Sale } from "@/lib/db/models";
import { z } from "zod";

const updateUserSchema = z.object({
  email: z.string().email("Email invalide").optional(),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caracteres").optional(),
  name: z.string().min(1, "Nom est requis").optional(),
  role: z.enum(["admin", "seller"]).optional(),
  isActive: z.boolean().optional(),
});

// GET single user (admin only)
export async function GET(
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

    const user = await User.findById(id).select("-password");

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouve" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation de l'utilisateur" },
      { status: 500 }
    );
  }
}

// PUT update user (admin only)
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
    const validatedData = updateUserSchema.parse(body);

    await dbConnect();

    // Check if new email already exists (if email is being changed)
    if (validatedData.email) {
      const existing = await User.findOne({
        email: validatedData.email,
        _id: { $ne: id },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Un utilisateur avec cet email existe deja" },
          { status: 400 }
        );
      }
    }

    // Prevent self-deactivation
    if (id === session.user.id && validatedData.isActive === false) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas desactiver votre propre compte" },
        { status: 400 }
      );
    }

    // If password is provided, it will be hashed by the model middleware
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouve" },
        { status: 404 }
      );
    }

    // Update fields
    if (validatedData.email) user.email = validatedData.email;
    if (validatedData.name) user.name = validatedData.name;
    if (validatedData.role) user.role = validatedData.role;
    if (validatedData.isActive !== undefined) user.isActive = validatedData.isActive;
    if (validatedData.password) user.password = validatedData.password;

    await user.save();

    // Return user without password
    const userResponse = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json(userResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour de l'utilisateur" },
      { status: 500 }
    );
  }
}

// DELETE user (admin only)
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

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user has created bags or sales
    const bagsCount = await Bag.countDocuments({ createdBy: id });
    const salesCount = await Sale.countDocuments({ soldBy: id });

    if (bagsCount > 0 || salesCount > 0) {
      return NextResponse.json(
        {
          error: `Cet utilisateur a cree ${bagsCount} sac(s) et ${salesCount} vente(s). Desactivez-le plutot que de le supprimer.`,
        },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouve" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Utilisateur supprime avec succes" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'utilisateur" },
      { status: 500 }
    );
  }
}
