import mongoose from "mongoose";

const certificationIssuerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Issuer name is required."],
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["issuer", "subject", "voucher"],
      default: "issuer",
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const CertificationIssuer = mongoose.model("CertificationIssuer", certificationIssuerSchema);
