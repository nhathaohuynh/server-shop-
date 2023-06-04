import ErrorHandler from "../utils/ErrorHandler.js";
import { catchAsyncError } from "./catchAsyncError.js";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import shop from "../models/shop.js";

export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) return next(new ErrorHandler("Please login to continue", 401));

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  req.user = await User.findById(decoded.id);

  next();
});

export const isSeller = catchAsyncError(async (req, res, next) => {
  const { shop_token } = req.cookies;
  if (!shop_token)
    return next(new ErrorHandler("Please login to continue", 401));

  const decoded = jwt.verify(shop_token, process.env.JWT_SECRET_KEY);

  req.seller = decoded;
  next();
});
