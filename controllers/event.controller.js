import express from "express";

const router = express.Router();
import { isSeller } from "../middleware/auth.js";
import { catchAsyncError } from "../middleware/catchAsyncError.js";
import Event from "../models/event.js";
import upload from "../multer.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import Shop from "../models/shop.js";
import { uploadMultiple } from "../utils/cloudinary.js";

//create Event

router.post(
  "/create-event",
  isSeller,
  upload.array("images"),
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

      const eventData = req.body;
      eventData.images = images;
      eventData.shop = shop;

      const event = await Event.create(eventData);

      res.status(201).json({
        success: true,
        event,
      });
    } catch (err) {
      return next(new ErrorHandler(err.message, 500));
    }
  })
);

router.get(
  "/getAllEvent/:id",
  catchAsyncError(async (req, res, next) => {
    try {
      const shopId = req.params.id;

      const events = await Event.find({ shopId });

      if (!events[0])
        return next(new ErrorHandler("can not get null event", 400));

      res.status(201).json({
        success: true,
        events,
      });
    } catch (err) {
      return next(new ErrorHandler(err.message, 500));
    }
  })
);

router.delete(
  "/deleteEvent/:id",
  isSeller,
  catchAsyncError(async (req, res, next) => {
    try {
      const eventId = req.params.id;

      const events = await Event.findOneAndDelete({ _id: eventId });

      res.status(200).json({
        success: true,
        events,
      });
    } catch (err) {
      return next(new ErrorHandler(err.message, 500));
    }
  })
);

router.get(
  "/all",
  catchAsyncError(async (req, res, next) => {
    try {
      const events = await Event.find();
      if (!events[0]) return next(new ErrorHandler("can not get events", 400));

      res.status(201).json({
        success: true,
        events,
      });
    } catch (err) {
      return next(new ErrorHandler(err.message, 500));
    }
  })
);

export default router;
