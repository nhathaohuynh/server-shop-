import express from "express";
const router = express.Router();
import ErrorHandler from "../utils/ErrorHandler.js";
import { catchAsyncError } from "../middleware/catchAsyncError.js";
import Coupon from "../models/coupon.js";
import Shop from "../models/shop.js";
import { isSeller } from "../middleware/auth.js";

router.post(
  "/create-coupon",
  isSeller,
  catchAsyncError(async (req, res, next) => {
    try {
      const shopId = req.body.shopId;
      const name = req.body.name;
      const couponCode = await Coupon.find({ name });
      const shop = await Shop.findById(shopId);

      if (!shop) return next(new ErrorHandler("Can not get shop", 400));

      if (couponCode[0])
        return next(new ErrorHandler("Coupon code was existed", 400));

      const couponData = req.body;
      couponData.shop = shop;

      const coupon = await Coupon.create(couponData);

      res.status(201).json({
        success: true,
        coupon,
      });
    } catch (err) {
      return new (ErrorHandler(err.message, 500))();
    }
  })
);

router.get(
  "/getAllCoupon/:id",
  catchAsyncError(async (req, res, next) => {
    try {
      const shopId = req.params.id;
      const coupons = await Coupon.find({ shopId });

      if (!coupons[0])
        return next(new ErrorHandler("cant not get coupoun code", 400));

      res.status(201).json({
        success: true,
        coupons,
      });
    } catch (err) {
      return next(new ErrorHandler(err.message, 500));
    }
  })
);

router.delete(
  "/deleteCoupon/:id",
  isSeller,
  catchAsyncError(async (req, res, next) => {
    try {
      const id = req.params.id;

      const coupon = await Coupon.findOneAndDelete({ _id: id });

      res.status(201).json({
        success: true,
        coupon,
      });
    } catch (err) {
      return next(new ErrorHandler(err.message, 500));
    }
  })
);
export default router;
