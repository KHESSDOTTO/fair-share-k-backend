import { Schema, model } from "mongoose";

const businessSchema = new Schema({
  name: { type: String, required: true },
  businessType: { type: String, required: true },
  about: { type: String, required: true },
  products: { type: String, required: true },
});

export const BusinessModel = model("BusinessProfile", businessSchema);
