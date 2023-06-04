import mongoose from "mongoose";

const couponSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your counpoun code"],
    unique: true,
  },
  value: {
    type: Number,
    required: true,
  },
  minAmount: {
    type: Number,
  },
  shop: {
    type: Object,
    required: true,
  },
  shopId: {
    type: String,
    required: true,
  },
  maxAmount: {
    type: Number,
  },
  createAt: {
    type: Date,
    default: new Date(Date.now()),
  },
});

export default mongoose.model("Coupon", couponSchema);
