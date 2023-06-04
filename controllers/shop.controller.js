import express from "express";
import upload from "../multer.js";
import path from "path";
const router = express.Router();
import Shop from "../models/shop.js";
import jwt from "jsonwebtoken";
import sendMail from "../utils/sendMail.js";
import { sendShopToken } from "../utils/jwtToken.js";
import { isSeller } from "../middleware/auth.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { catchAsyncError } from "../middleware/catchAsyncError.js";
import { uploadSingle } from "../utils/cloudinary.js";
import Product from "../models/product.js";

router.post("/create-shop", upload.single("file"), async (req, res, next) => {
  try {
    const { email } = req.body;
    let fileUrl = "";
    await uploadSingle(req.file.path).then((result) => {
      fileUrl = result.url;
    });
    const sellerEmail = await Shop.findOne({ email });
    if (sellerEmail) {
      return next(new ErrorHandler("Email Alredy exists", 400));
    }

    const seller = {
      name: req.body.name,
      email: email,
      password: req.body.password,
      avatar: fileUrl,
      address: req.body.address,
      phone: req.body.phone,
      zipCode: req.body.zipCode,
    };

    const activationToken = createActivationToken(seller);

    const activationUrl = `http://localhost:5173/activation/shop?token=${activationToken}`;
    try {
      await sendMail({
        email: seller.email,
        subject: "Active your shop",
        message: `Hello ${seller.name} please click on the link to active your shop : ${activationUrl}`,
      });

      res.status(201).json({
        success: true,
        message: `Plese check your email :- ${seller.email} to activate your shop`,
      });
    } catch (err) {
      return next(new ErrorHandler(err.message, 400));
    }
  } catch (err) {
    return next(new ErrorHandler(err.message, 400));
  }
});

function createActivationToken(seller) {
  return jwt.sign(seller, process.env.ACTIVATIONTOKEN_SECRET, {
    expiresIn: "5d",
  });
}

router.post(
  "/activation",
  catchAsyncError(async (req, res, next) => {
    try {
      const { activation_token } = req.body;
      const newSeller = jwt.verify(
        activation_token,
        process.env.ACTIVATIONTOKEN_SECRET
      );

      if (!newSeller) return next(new ErrorHandler("Invalid token", 400));

      const { name, email, password, phone, address, avatar, zipCode } =
        newSeller;

      const sellerEmail = await Shop.findOne({ email });

      if (sellerEmail) return next(new ErrorHandler("Shop already exists"));

      const seller = await Shop.create({
        name,
        email,
        password,
        avatar,
        zipCode,
        address,
        phone,
      });

      sendShopToken(seller, 201, res);
    } catch (err) {
      return next(new ErrorHandler(err.message, 500));
    }
  })
);

router.post(
  "/login-seller",
  catchAsyncError(async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const seller = await Shop.findOne({ email }).select("+password");

      if (!email || !password)
        return next(new ErrorHandler("Please provide the all field", 400));

      if (!seller)
        return next(new ErrorHandler("Account doest not exists", 400));

      const isPasswordValid = await seller.comparePassword(password);
      if (!isPasswordValid)
        return next(new ErrorHandler("Email or password is invalid", 400));

      sendShopToken(seller, 201, res);
    } catch (err) {
      return next(new ErrorHandler(err.message, 500));
    }
  })
);

router.get(
  "/seller",
  isSeller,
  catchAsyncError(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req?.seller?.id);
      if (!seller)
        return next(new ErrorHandler("Accountt does not exists", 400));

      res.status(201).json({
        success: true,
        seller,
      });
    } catch (err) {
      return next(new ErrorHandler(err.message, 500));
    }
  })
);

router.get(
  "/getInfo/:id",
  catchAsyncError(async (req, res, next) => {
    try {
      const { id } = req.params;
      const shop = await Shop.findById(id);

      const products = await Product.find({ shopId: id });

      res.status(201).json({
        success: true,
        shop,
        products,
      });
    } catch (err) {
      return next(new ErrorHandler(err.message, 500));
    }
  })
);

export default router;
