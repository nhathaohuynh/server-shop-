import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const shopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your shop name"],
  },
  email: {
    type: String,
    required: [true, "Please enter your email shop address"],
  },
  password: {
    type: String,
    required: [true, "Please Enter your password"],
    minLength: [6, "Password should be grater than 6 chracters"],
    select: false,
  },
  description: {
    type: String,
  },

  address: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
  },
  role: {
    type: String,
    default: "seller",
  },
  avatar: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  createAt: {
    type: Date,
    default: new Date(Date.now()),
  },
  resetPasswordToken: String,
  resetPasswordTime: Date,
});

shopSchema.pre("save", async function (next) {
  if (!this.isModified("password")) next();
  this.password = await bcrypt.hash(this.password, 10);
});

shopSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

shopSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("Shop", shopSchema);
