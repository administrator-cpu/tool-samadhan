import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
      : "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.use("/api", userRoutes);
app.use("/api/tickets", ticketRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ statusCode: 200, message: "OK" });
});

app.use(errorHandler);

export default app;