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
      const user = await User.findById(req?.user?._id);

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

// update profile user

router.put(
  "/update-info",
  isAuthenticated,
  upload.single("file"),
  catchAsyncError(async (req, res, next) => {
    try {
      const { name, email, password, phone } = req.body;
      const user = await User.findOne({
        email,
      }).select("+password");
      const isPasswordValid = await user.comparePassword(password);

      if (!user) return next(new ErrorHandler("User not found", 404));

      if (!isPasswordValid)
        return next(new ErrorHandler("Password is invalid", 400));

      if (req?.file?.path) {
        const result = await uploadSingle(req.file.path);
        user.avatar = result.url;
      }

      user.name = name;
      user.email = email;
      user.phoneNumber = phone;
      await user.save();

      res.status(200).json({
        success: true,
        user,
      });
    } catch (err) {
      return next(new ErrorHandler(err.message, 500));
    }
  })
);

// change password user

router.put(
  "/update-password",
  isAuthenticated,
  catchAsyncError(async (req, res, next) => {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId).select("+password");
      const isPasswordMatched = await user.comparePassword(
        req.body.oldPassword
      );

      if (!isPasswordMatched)
        return next(new ErrorHandler("Old password is incorrect", 400));

      if (req.body.newPassword !== req.body.confirmPassword)
        return next(
          new ErrorHandler("Password dost not matched with each other", 400)
        );
      user.password = req.body.newPassword; // getter and  setter are available in mongoose
      await user.save();

      res.status(200).json({
        success: true,
        message: "Password was updated successfully",
      });
    } catch (err) {
      return next(new ErrorHandler(err.message, 5000));
    }
  })
);

//delete
router.delete(
  "/address/:id",
  isAuthenticated,
  catchAsyncError(async (req, res, next) => {
    try {
      const addressId = req.params.id;
      const user = await User.findById(req.user._id);
      const existAddress = user.addresses.find(
        (address) => address._id !== addressId
      );

      if (!existAddress)
        return next(new ErrorHandler("addressId doest not exist", 400));

      await user.updateOne(
        { $pull: { addresses: { _id: addressId } } },
        { multi: true }
      );
      const newUser = await User.findById(user._id);

      res.status(200).json({
        success: true,
        user: newUser,
      });
    } catch (err) {
      return next(new ErrorHandler(err.message, 500));
    }
  })
);
// update address
router.put(
  "/address",
  isAuthenticated,
  catchAsyncError(async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id);

      const isSameTypeAddress = user.addresses.some(
        (address) => address.addressType === req.body.addressType
      );

      if (isSameTypeAddress)
        return next(
          new ErrorHandler(
            `${req.body.addressType} address already exists`,
            400
          )
        );
      user.addresses.push(req.body);
      await user.save();

      res.status(200).json({
        sucess: true,
        user,
      });
    } catch (err) {
      return next(new ErrorHandler(err.message, 500));
    }
  })
);
router.put(
  "/address/default",
  isAuthenticated,
  catchAsyncError(async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id);
      console.log(req.body.addressType);

      const indexAddress = user.addresses.findIndex(
        (address) => address.addressType === req.body.addressType
      );

      user.addresses.forEach((address, index) => {
        if (index === indexAddress) {
          Object.assign(address, {
            default: true,
          });
        } else {
          Object.assign(address, {
            default: false,
          });
        }
      });

      await user.save();

      const newUser = await User.findById(user?._id);

      res.status(200).json({
        success: true,
        user: newUser,
      });
    } catch (err) {
      return next(new ErrorHandler(err.message, 500));
    }
  })
);
//  set default
export default router;
