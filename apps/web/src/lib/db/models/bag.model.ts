import mongoose, { Schema, Document, Model } from "mongoose";

export type BagCondition =
  | "neuf_etiquette"
  | "neuf_sans_etiquette"
  | "tres_bon"
  | "bon"
  | "correct";

export type BagStatus =
  | "en_commande"
  | "en_transit"
  | "recu"
  | "en_remise_en_etat"
  | "pret_a_vendre"
  | "en_vente"
  | "vendu";

export type Platform = "vinted" | "vestiaire_collectif" | "autre";

export interface IBagDocument {
  _id: mongoose.Types.ObjectId;
  reference: string;
  brand: string;
  model: string;
  description: string;
  color?: string;
  size?: string;
  condition: BagCondition;
  purchaseDate: Date;
  purchasePrice: number;
  purchasePlatform: Platform;
  purchaseBankAccountId: mongoose.Types.ObjectId;
  refurbishmentCost: number;
  refurbishmentProvider?: string;
  refurbishmentNotes?: string;
  salePrice?: number;
  saleNotes?: string;
  photos: string[];
  status: BagStatus;
  qrCodeUrl?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type IBag = IBagDocument & Document;

const BagSchema = new Schema<IBagDocument>(
  {
    reference: {
      type: String,
      unique: true,
    },
    brand: {
      type: String,
      required: [true, "Marque est requise"],
      trim: true,
    },
    model: {
      type: String,
      required: [true, "Modele est requis"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description est requise"],
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    size: {
      type: String,
      trim: true,
    },
    condition: {
      type: String,
      enum: ["neuf_etiquette", "neuf_sans_etiquette", "tres_bon", "bon", "correct"],
      required: [true, "Etat est requis"],
    },
    purchaseDate: {
      type: Date,
      required: [true, "Date d'achat est requise"],
    },
    purchasePrice: {
      type: Number,
      required: [true, "Prix d'achat est requis"],
      min: [0, "Le prix ne peut pas etre negatif"],
    },
    purchasePlatform: {
      type: String,
      enum: ["vinted", "vestiaire_collectif", "autre"],
      required: [true, "Plateforme d'achat est requise"],
    },
    purchaseBankAccountId: {
      type: Schema.Types.ObjectId,
      ref: "BankAccount",
      required: [true, "Compte bancaire est requis"],
    },
    refurbishmentCost: {
      type: Number,
      default: 0,
      min: [0, "Les frais ne peuvent pas etre negatifs"],
    },
    refurbishmentProvider: {
      type: String,
      trim: true,
    },
    refurbishmentNotes: {
      type: String,
      trim: true,
    },
    salePrice: {
      type: Number,
      min: [0, "Le prix ne peut pas etre negatif"],
    },
    saleNotes: {
      type: String,
      trim: true,
    },
    photos: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: [
        "en_commande",
        "en_transit",
        "recu",
        "en_remise_en_etat",
        "pret_a_vendre",
        "en_vente",
        "vendu",
      ],
      default: "en_commande",
    },
    qrCodeUrl: {
      type: String,
    },
    createdBy: {
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
BagSchema.index({ status: 1 });
BagSchema.index({ brand: 1 });
BagSchema.index({ purchaseBankAccountId: 1 });
BagSchema.index({ createdAt: -1 });

// Auto-generate reference before saving
BagSchema.pre("save", async function (next) {
  if (this.isNew && !this.reference) {
    const year = new Date().getFullYear();
    const count = await mongoose.models.Bag.countDocuments();
    this.reference = `MC-${year}-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

const Bag: Model<IBagDocument> =
  mongoose.models.Bag || mongoose.model<IBagDocument>("Bag", BagSchema);

export default Bag;
