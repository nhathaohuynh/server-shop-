import express from "express";
const router = express.Router();
import Product from "../models/product.js";
import Shop from "../models/shop.js";
import upload from "../multer.js";
import { catchAsyncError } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { isSeller } from "../middleware/auth.js";
import { uploadMultiple } from "../utils/cloudinary.js";

// create product function

router.post(
  "/create-product",
  isSeller,
  upload.array("files"),
  catchAsyncError(async (req, res, next) => {
    try {
      const shopId = req.body.shopId;
      const shop = await Shop.findById(shopId);
      let images = [];

      if (!shop) return next(new ErrorHandler("Shop does not exist", 400));

      const imagesUrl = req.files.map(async (file) => {
        return uploadMultiple(file.path);
      });
      await Promise.all(imagesUrl).then((arrImg) => {
        images = arrImg.map((item) => item.url);
      });

      const productData = req.body;
      productData.images = images;
      productData.shop = shop;

      const product = await Product.create(productData);
      return res.status(201).json({
        success: true,
        product,
      });
    } catch (err) {
      return next(new ErrorHandler(err.message, 500));
    }
  })
);

router.get(
  "/getAllProducts/:id",
  catchAsyncError(async (req, res, next) => {
    try {
      const shopId = req.params.id;
      if (!shopId)
        next(new ErrorHandler("Please provide some infomation", 400));
      const products = await Product.find({ shopId });

      if (!products[0])
        return next(new ErrorHandler("Can not get products", 400));
      res.status(200).json({
        success: true,
        products,
      });
    } catch (err) {
      return next(new ErrorHandler(err.message, 500));
    }
  })
);

router.delete(
  "/deleteProduct/:id",
  isSeller,
  catchAsyncError(async (req, res, next) => {
    try {
      const id = req.params.id;

      const products = await Product.findOneAndDelete({ _id: id });

      res.status(201).json({
        success: true,
        products,
      });
    } catch (err) {
      return next(new ErrorHandler(err.message, 400));
    }
  })
);

router.get(
  "/all",
  catchAsyncError(async (req, res, next) => {
    try {
      const products = await Product.find();
      if (!products[0])
        return next(new ErrorHandler("can not get product", 400));
      res.status(201).json({
        success: true,
        products,
      });
    } catch (err) {
      return next(new ErrorHandler(err.message, 500));
    }
  })
);

router.get(
  "/logout",
  isSeller,
  catchAsyncError(async (req, res, next) => {
    try {
      res.cookie("shop_token", null, {
        expries: new Date(Date.now()),
        httpOnly: true,
      });

      res.status(201).json({
        success: true,
        message: "Logout successfully",
      });
    } catch (err) {
      return next(new ErrorHandler(err.message, 5000));
    }
  })
);

export default router;
