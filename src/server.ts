import app from "./app.js";
import { prisma } from "./app/lib/prisma.js";

const port = process.env.PORT || 8000;

const bootstrap = async () => {
  try {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
  }
}
bootstrap();