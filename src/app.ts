

import express, { Application, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { IndexRoute } from './app/routes/index.js';
import { globalErrorHandler } from './middleware/globalErrorHandeler.js';
import { notFoundHandler } from './middleware/notFound.js';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './app/lib/auth.js';
import cors from "cors";
import { envVars } from "./config/env.js";

const app:Application = express();

app.use((req, res, next) => {
  const startedAt = Date.now();
  console.log(`[request] ${req.method} ${req.originalUrl} started`);

  res.on("finish", () => {
    console.log(`[request] ${req.method} ${req.originalUrl} finished ${res.statusCode} ${Date.now() - startedAt}ms`);
  });

  next();
});

// Required behind Vercel/other reverse proxies so secure cookies and OAuth
// callback flows work correctly across HTTPS origins.
app.set("trust proxy", 1);

// Middleware to parse JSON bodies
app.use(express.json());
// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = [
  envVars.FRONTEND_URL,
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    exposedHeaders: ["X-Session-Refresh", "X-Session-Expires-At", "X-Time-Remaining"],
  })
);

app.use("/api/auth", toNodeHandler(auth));

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'E-Commerce API is running',
    version: '1.0.0',
    docs: '/api/v1',
  });
});

app.use("/api/v1",IndexRoute);


app.use(globalErrorHandler);
app.use(notFoundHandler);

export default app;