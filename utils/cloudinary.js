import cloudinary from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import fs from "fs";

const cloudinaries = cloudinary.v2;

cloudinaries.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

export const uploadSingle = (file) => {
  return new Promise((resolve) => {
    cloudinary.uploader
      .upload(file, {
        folder: "shop",
      })
      .then((result) => {
        if (result) {
          fs.unlinkSync(file);
          resolve({
            url: result.secure_url,
          });
        }
      });
  });
};

export const uploadMultiple = (file) => {
  return new Promise((resolve) => {
    cloudinary.uploader
      .upload(file, {
        folder: "shop",
      })
      .then((result) => {
        if (result) {
          fs.unlinkSync(file);
          resolve({
            url: result.secure_url,
          });
        }
      });
  });
};

