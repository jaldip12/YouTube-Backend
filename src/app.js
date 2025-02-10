import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

// Route imports
import router from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import tweetRouter from "./routes/tweet.routes.js";

// Initialize express app
const app = express();
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        status: "error",
        message: "Too many requests from this IP, please try again after 15 minutes"
    }
});

// Apply rate limiter to all routes
app.use(limiter);
// Global Middleware Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// API Health Check
app.get("/api/v1", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "API is running",
  });
});

// API Routes
const API_PREFIX = "/api/v1";

app.use(`${API_PREFIX}/users`, router);
app.use(`${API_PREFIX}/healthcheck`, healthcheckRouter);
app.use(`${API_PREFIX}/tweets`, tweetRouter);
app.use(`${API_PREFIX}/videos`, videoRouter);
app.use(`${API_PREFIX}/likes`, likeRouter);
app.use(`${API_PREFIX}/playlists`, playlistRouter);
app.use(`${API_PREFIX}/subscriptions`, subscriptionRouter);
app.use(`${API_PREFIX}/dashboard`, dashboardRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: "error",
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Handle 404 routes
app.use("*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
  });
});

if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

export { app };
