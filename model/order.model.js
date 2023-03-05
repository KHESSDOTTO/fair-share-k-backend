import { Schema, model } from "mongoose";

const orderSchema = new Schema({
  client: { type: String, required: true, ref: "User" },
  business: { type: String, required: true, ref: "User" },
  withdraw: { type: Date, required: true },
  status: {
    type: String,
    enum: [
      "REJECTED BY COMPANY",
      "CONFIRMED BY COMPANY",
      "CONCLUDED",
      "CANCELED",
    ],
    default: "PENDING",
  },
});

export const OrderModel = model("Order", orderSchema);
