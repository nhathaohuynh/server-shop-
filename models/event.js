import mongoose from "mongoose";

const EventSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your event product name"],
  },

  description: {
    type: String,
    required: [true, "Please enter your event product description"],
  },
  category: {
    type: String,
    required: [true, "Please enter your event product category"],
  },
  startDate: {
    type: Date,
    required: true,
  },
  finishDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    default: "running",
  },
  tags: {
    type: String,
  },
  originalPrice: {
    type: Number,
  },
  discountPrice: {
    type: Number,
    required: [true, "Please enter your event product price"],
  },
  stock: {
    type: Number,
    required: [true, "Please enter your event product stock"],
  },
  images: [
    {
      type: String,
    },
  ],
  shopId: {
    type: String,
    required: true,
  },
  shop: {
    type: Object,
    required: true,
  },
  sold_out: {
    type: Number,
    default: 0,
  },
  createAt: {
    type: Date,
    default: Date.now(),
  },
});

export default mongoose.model("Event", EventSchema);
