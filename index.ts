import express from "express";
import cookieParser from "cookie-parser";
import { Pool } from "pg";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes";
import blogRoutes from "./routes/blogRoutes";
import postRoutes from "./routes/postRoutes";
import commentRoutes from "./routes/commentRoutes";
import { createTables } from "./src/db/init";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

export const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "blog_api",
  password: process.env.DB_PASSWORD || "postgres",
  port: Number.parseInt(process.env.DB_PORT || "5432"),
});

app.use(express.json());
app.use(cookieParser());

app.use("/users", userRoutes);
app.use("/blogs", blogRoutes);
app.use("/posts", postRoutes);
app.use("/comments", commentRoutes);

app.get("/", (req, res) => {
  res.send("Blog API is running");
});

async function startServer() {
  try {
    await createTables();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
