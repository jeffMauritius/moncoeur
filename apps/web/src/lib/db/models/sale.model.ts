import mongoose, { Schema, Document, Model } from "mongoose";
import Bag from "./bag.model";

export type Platform = "vinted" | "vestiaire_collectif" | "autre";

export interface ISale extends Document {
  _id: mongoose.Types.ObjectId;
  bagId: mongoose.Types.ObjectId;
  saleDate: Date;
  salePrice: number;
  salePlatform: Platform;
  platformFees?: number;
  shippingCost?: number;
  bankAccountId: mongoose.Types.ObjectId;
  margin: number;
  marginPercent: number;
  notes?: string;
  soldBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SaleSchema = new Schema<ISale>(
  {
    bagId: {
      type: Schema.Types.ObjectId,
      ref: "Bag",
      required: [true, "Sac est requis"],
      unique: true,
    },
    saleDate: {
      type: Date,
      required: [true, "Date de vente est requise"],
    },
    salePrice: {
      type: Number,
      required: [true, "Prix de vente est requis"],
      min: [0, "Le prix ne peut pas etre negatif"],
    },
    salePlatform: {
      type: String,
      enum: ["vinted", "vestiaire_collectif", "autre"],
      required: [true, "Plateforme de vente est requise"],
    },
    platformFees: {
      type: Number,
      default: 0,
      min: [0, "Les frais ne peuvent pas etre negatifs"],
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: [0, "Les frais ne peuvent pas etre negatifs"],
    },
    bankAccountId: {
      type: Schema.Types.ObjectId,
      ref: "BankAccount",
      required: [true, "Compte bancaire est requis"],
    },
    margin: {
      type: Number,
      required: true,
    },
    marginPercent: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    soldBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
SaleSchema.index({ saleDate: -1 });
SaleSchema.index({ bankAccountId: 1 });
SaleSchema.index({ salePlatform: 1 });

// Calculate margin before saving
SaleSchema.pre("save", async function (next) {
  if (this.isModified("salePrice") || this.isModified("platformFees") || this.isModified("shippingCost") || this.isNew) {
    try {
      const bag = await Bag.findById(this.bagId);
      if (bag) {
        const totalCost = bag.purchasePrice + (bag.refurbishmentCost || 0);
        const totalFees = (this.platformFees || 0) + (this.shippingCost || 0);
        this.margin = this.salePrice - totalCost - totalFees;
        this.marginPercent = totalCost > 0 ? (this.margin / totalCost) * 100 : 0;
      }
    } catch (error) {
      next(error as Error);
    }
  }
  next();
});

// Update bag status to "vendu" after sale is created
SaleSchema.post("save", async function (doc) {
  try {
    await Bag.findByIdAndUpdate(doc.bagId, { status: "vendu" });
  } catch (error) {
    console.error("Error updating bag status:", error);
  }
});

const Sale: Model<ISale> =
  mongoose.models.Sale || mongoose.model<ISale>("Sale", SaleSchema);

export default Sale;
