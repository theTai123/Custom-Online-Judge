import express from "express";
import session from "express-session";
import bodyParser from "body-parser";

import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import submitRoutes from "./routes/submit.js";
import problemsRoutes from "./routes/problems.js";
import historyRoutes from "./routes/history.js";
import userinfoRoutes from "./routes/userinfo.js";

import { initDB } from "./database/db.js";

import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public/"));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET_KEY || "default-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 3, // 3h
    },
  }),
);

app.use("/", authRoutes);
app.use("/", dashboardRoutes);
app.use("/", submitRoutes);
app.use("/", problemsRoutes);
app.use("/", historyRoutes);
app.use("/", userinfoRoutes);

try {
  await initDB();

  app.listen(port, () =>
    console.log(`Server chạy tại http://localhost:${port}`),
  );
} catch (err) {
  console.error("Lỗi khi khởi tạo cơ sở dữ liệu:", err);
  process.exit(1);
}
