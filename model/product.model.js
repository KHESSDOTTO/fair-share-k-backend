import { Schema, model } from "mongoose";

const productSchema = new Schema({
  name: { type: String, required: true },
  picture: { type: String, required: true },
  price: { type: Number, required: true },
  expirationDate: { type: Date, required: true },
  creator: { type: Schema.Types.ObjectId, required: true, ref: "User" },
});

export const ProductModel = model("Product", productSchema);
