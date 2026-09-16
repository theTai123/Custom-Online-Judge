import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { openDB } from "../database/db.js";
import { loginCheck } from "../middleware/authCheck.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get("/history", loginCheck, async (req, res) => {
  const db = await openDB();

  const userId = req.session.userId;

  const history = await db.all(
    `SELECT s.id, s.score 
     AS submission_score, s.status, p.title, p.score AS problem_score 
     FROM submissions s 
     JOIN problems p 
     ON s.problem_id = p.problem_id 
     WHERE s.user_id = ? 
     ORDER BY s.created_at DESC`,
    [userId],
  );

  res.json({ history });
});

export default router;
