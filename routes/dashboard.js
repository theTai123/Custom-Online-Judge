import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { loginCheck } from "../middleware/authCheck.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get("/", loginCheck, (req, res) => {
  res.redirect("/dashboard");
});

router.get("/dashboard", loginCheck, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/dashboard.html"));
});

export default router;
