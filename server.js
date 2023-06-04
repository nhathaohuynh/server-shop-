import app from "./app.js";
import dotenv from "dotenv";
import connectDatabase from "./db/database.js";

// handling uncaught exception
process.on("uncaughtException", (err) => {
  console.log(`Error : ${err.message}`);
  console.log("Shutting down the server for handling uncaught exception");
});

// config env
if (process.env.NODE_ENV !== "PRODUCTION") {
  dotenv.config({
    path: "configs/.env",
  });
}
// connect to databse
// console.log(process.env.PORT)

connectDatabase();

// create server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

// unhandled promise rejection

process.on("unhandledRejection", (err) => {
  console.log(`Shutting down the server for ${err.message}`);
  console.log(`shutting down the server for unhandle promise rejection`);

  server.close(() => {
    process.exit(1);
  });
});
