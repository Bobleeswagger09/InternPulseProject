import express from "express";
import { connectToDatabase } from "./config/db";
import userRoutes from "./routes/userRoutes";
// import errorHandler from "./middleware/errorHandler"; // Optional: Import custom error handler

const app = express();
app.use(express.json());

connectToDatabase()
  .then(() => {
    app.use("/api", userRoutes);

    // Optional: Use custom error handler
    // app.use(errorHandler);
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1); // Exit the process if the database connection fails
  });

export default app;
