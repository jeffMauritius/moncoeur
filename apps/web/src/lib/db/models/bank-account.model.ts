import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBankAccount extends Document {
  _id: mongoose.Types.ObjectId;
  label: string;
  description?: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BankAccountSchema = new Schema<IBankAccount>(
  {
    label: {
      type: String,
      required: [true, "Libelle est requis"],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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

const BankAccount: Model<IBankAccount> =
  mongoose.models.BankAccount ||
  mongoose.model<IBankAccount>("BankAccount", BankAccountSchema);

export default BankAccount;
