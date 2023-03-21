import { Schema, model } from "mongoose";

const userSchema = new Schema({
  picture: {
    type: String,
    default:
      "https://res.cloudinary.com/dukhlscyh/image/upload/v1678297300/pictures/file_zbjqpx.png",
  },
  name: { type: String, required: true, trim: true, unique: true },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^[\w\.]+@([\w-]+\.)+[\w-]{2,4}$/,
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
  emailConfirm: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true, required: true },
});

export const UserModel = model("User", userSchema);
