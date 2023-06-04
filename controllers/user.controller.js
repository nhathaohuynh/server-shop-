import express from "express";
const router = express.Router();
import path from "path";
import upload from "../multer.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import User from "../models/user.js";
import fs from "fs";
import jwt from "jsonwebtoken";
import sendMail from "../utils/sendMail.js";
import { catchAsyncError } from "../middleware/catchAsyncError.js";
import { sendToken } from "../utils/jwtToken.js";
import { isAuthenticated } from "../middleware/auth.js";
import { uploadSingle } from "../utils/cloudinary.js";

router.post("/create-user", upload.single("file"), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    let fileUrl = "";
    await uploadSingle(req.file.path).then((result) => {
      fileUrl = result.url;
    });

    const userEmail = await User.findOne({ email });

    if (userEmail) {
      return next(new ErrorHandler("User already exists", 400));
    }

    const user = {
      name: name,
      email: email,
      password: password,
      avatar: fileUrl,
    };

    const activationToken = createActivationToken(user);
    const activationUrl = `http://localhost:5173/activation/active?token=${activationToken}`;

    try {
      await sendMail({
        email: user.email,
        subject: "Active your account",
        message: `Hello ${user.name} please click on the link to active your account : ${activationUrl}`,
      });

      res.status(201).json({
        success: true,
        message: `Plese check your email :- ${user.email} to activate your account`,
      });
    } catch (err) {
      return next(new ErrorHandler(err.message, 500));
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// create activation Token

const createActivationToken = (user) => {
  return jwt.sign(user, process.env.ACTIVATIONTOKEN_SECRET, {
    expiresIn: "5d",
  });
};

// activate token

router.post(
  "/activation",
  catchAsyncError(async (req, res, next) => {
    try {
      const { activation_token } = req.body;
      const newUser = jwt.verify(
        activation_token,
        process.env.ACTIVATIONTOKEN_SECRET
      );

      if (!newUser) {
        return next(new ErrorHandler("Invalid token", 400));
      }

      const { name, email, password, avatar } = newUser;
      const userEmail = await User.findOne({ email });

      if (userEmail) return new ErrorHandler("User already exist", 400);
      const user = await User.create({
        name,
        email,
        password,
        avatar,
      });

      sendToken(user, 201, res);
    } catch (err) {
      return next(new ErrorHandler(err));
    }
  })
);

/// login - user ;

router.post(
  "/login-user",
  catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password)
      return next(new ErrorHandler("Please provide the all fields!", 400));

    const user = await User.findOne({ email }).select("+password");

    if (!user) return next(new ErrorHandler("User doesn't exists!", 404));
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid)
      return next(new ErrorHandler("Username or passowrd is invalid", 400));

    sendToken(user, 201, res);
  })
);

// load user when they login

router.get(
  "/get-user",
  isAuthenticated,
  catchAsyncError(async (req, res, next) => {
    try {
      const user = await User.findById(req?.user?.id);

      if (!user) return next(new ErrorHandler("User doesn't exists", 400));

      res.status(200).json({
        success: true,
        user,
      });
    } catch (err) {
      return next(new ErrorHandler(err.message, 500));
    }
  })
);

// logout

router.get(
  "/logout",
  isAuthenticated,
  catchAsyncError((req, res, next) => {
    try {
      res.cookie("token", null, {
        expries: new Date(Date.now()),
        httpOnly: true,
      });

      res.status(201).json({
        success: true,
        message: "Logout successfully",
      });
    } catch (err) {
      return next(new ErrorHandler(err.message, 500));
    }
  })
);

export default router;
