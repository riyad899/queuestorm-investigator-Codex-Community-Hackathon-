
import express, { Application, Request, Response } from 'express';
import { IndexRoute } from './app/routes/index.js';
import { globalErrorHandler } from './middleware/globalErrorHandeler.js';
import { notFoundHandler } from './middleware/notFound.js';

const app:Application = express();

// Request logging
app.use((req, res, next) => {
  const startedAt = Date.now();
  console.log(`[request] ${req.method} ${req.originalUrl} started`);

  res.on("finish", () => {
    console.log(`[request] ${req.method} ${req.originalUrl} finished ${res.statusCode} ${Date.now() - startedAt}ms`);
  });

  next();
});

// Required behind Vercel/other reverse proxies.
app.set("trust proxy", 1);

// Middleware to parse JSON bodies
app.use(express.json());
// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API is Running ',
    version: '1.0.0',
    docs: '/',
  });
});

app.use("/", IndexRoute);


app.use(globalErrorHandler);
app.use(notFoundHandler);

export default app;
