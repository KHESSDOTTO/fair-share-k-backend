import { Schema, model } from "mongoose";

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, unique: true },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/gm,
  },
  passwordHash: { type: String, required: true },
  address: { type: String, rerquired: true, trim: true },
  businessType: {
    type: String,
    enum: ["BAKERY", "RESTAURANT", "BAR", "SUPERMARKET/GROCERY STORE", "OTHER"],
  },
  neighborhood: { type: String, required: true, trim: true },
  type: { type: String, enum: ["CLIENT", "BUSINESS"], required: true },
  cpf: {
    type: String,
    trim: true,
    match: /^[0-9]{11}$/gm,
    unique: true,
    sparse: true,
  },
  cnpj: {
    type: String,
    trim: true,
    match: /^[0-9]{14}$/gm,
    unique: true,
    sparse: true,
  },
  contactPhone: {
    type: String,
    trim: true,
    match: /^[0-9]{10,11}$/gm,
    unique: true,
  },
  favorites: [{ type: Schema.Types.ObjectId, ref: "User" }],
  orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
  products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  createdAt: { type: Date, default: Date.now() },
});

export const UserModel = model("User", userSchema);
