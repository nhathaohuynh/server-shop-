import express from "express";
import dotenv from "dotenv";
import ErrorHandler from "./utils/ErrorHandler.js";
const app = express();
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use("/", express.static("uploads"));
// app.use(
//   cors({
//     origin: "http://localhost:5173",
//     credentials: true,
//   })
// );
app.use(
  cors({
    origin: "https://client-shop-tau.vercel.app",
    credentials: true,
  })
);
// config env

if (process.env.NODE_ENV !== "PRODUCTION") {
  dotenv.config({
    path: "configs/.env",
  });
}

import user from "./controllers/user.controller.js";
import shop from "./controllers/shop.controller.js";
import product from "./controllers/product.controller.js";
import event from "./controllers/event.controller.js";
import coupon from "./controllers/coupon.controller.js";

app.use("/api/v1/user", user);
app.use("/api/v1/shop", shop);
app.use("/api/v1/product", product);
app.use("/api/v1/event", event);
app.use("/api/v1/coupon", coupon);

// it's for errorHandler
app.use(ErrorHandler);
export default app;
