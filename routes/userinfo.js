import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { openDB } from "../database/db.js";
import { loginCheck } from "../middleware/authCheck.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get("/userinfo", loginCheck, async (req, res) => {
  const db = await openDB();

  const userId = req.session.userId;
  const username = req.session.username;

  const infos = await db.get(
    `SELECT 
      COUNT(*) AS totalSubmissions, 
      COUNT(DISTINCT CASE WHEN status = 'AC' THEN problem_id END) AS solvedProblems
    FROM submissions
    WHERE user_id = ?`,
    [userId],
  );

  const totalScore = await db.get(
    `
    SELECT SUM(p.score) AS totalScore
    FROM problems p
    WHERE p.problem_id IN (
      SELECT DISTINCT s.problem_id
      FROM submissions s
      WHERE user_id = ? AND s.status = 'AC'
    )
    `,
    [userId],
  );

  res.json({ ...infos, ...totalScore, username });
});

export default router;
