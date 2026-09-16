import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { openDB } from "../database/db.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { notLoginCheck } from "../middleware/authCheck.js";

router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const db = await openDB();

  const existing = await db.get("SELECT * FROM users WHERE username = ?", [
    username,
  ]);
  if (existing)
    return res.json({ success: false, message: "Tên tài khoản đã tồn tại!" });

  await db.run("INSERT INTO users (username, password) VALUES (?, ?)", [
    username,
    password,
  ]);
  res.json({ success: true, message: "Đăng ký thành công! Hãy đăng nhập." });
});

router.post("/login", notLoginCheck, async (req, res) => {
  const { username, password } = req.body;
  const db = await openDB();

  const user = await db.get("SELECT * FROM users WHERE username = ?", [
    username,
  ]);
  if (!user)
    return res.json({
      success: false,
      message: "Sai tên tài khoản hoặc mật khẩu!",
    });

  const check = user.password === password;
  if (check) {
    req.session.authenticated = true;
    req.session.username = username;
    req.session.userId = user.id;

    if (user.username === (process.env.ADMIN_USERNAME || "admin")) {
      req.session.isAdmin = true;
    }

    req.session.save();
    res.send({ success: true });
  } else {
    res.send({ success: false, message: "Sai tên tài khoản hoặc mật khẩu!" });
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

router.get("/login", notLoginCheck, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/login.html"));
});

router.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/register.html"));
});

export default router;
