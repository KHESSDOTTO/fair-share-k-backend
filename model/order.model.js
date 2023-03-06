import { Schema, model } from "mongoose";

const orderSchema = new Schema({
  client: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  business: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  product: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
  withdraw: { type: Date, required: true },
  status: {
    type: String,
    enum: [
      "REJECTED BY COMPANY",
      "CONFIRMED BY COMPANY",
      "CONCLUDED",
      "CANCELED",
      "PENDING",
    ],
    default: "PENDING",
  },
});

export const OrderModel = model("Order", orderSchema);
