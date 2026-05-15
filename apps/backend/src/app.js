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
     origin: (process.env.CORS_ORIGIN || process.env.FRONTEND_URL)
      ? (process.env.CORS_ORIGIN || process.env.FRONTEND_URL).split(",").map((s) => s.trim())
      : "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// Debug middleware to log cookies (production only for investigation)
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    const cookieCount = req.cookies ? Object.keys(req.cookies).length : 0;
    if (cookieCount > 0) {
      console.log(`[DEBUG] Incoming cookies: ${Object.keys(req.cookies).join(", ")}`);
    } else {
      console.log(`[DEBUG] No cookies found in request to ${req.url}`);
    }
    next();
  });
}

app.use("/api", userRoutes);
app.use("/api/tickets", ticketRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ statusCode: 200, message: "OK" });
});

app.use(errorHandler);

export default app;
