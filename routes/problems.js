import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { openDB } from "../database/db.js";
import { loginCheck } from "../middleware/authCheck.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get("/problems", async (req, res) => {
  const db = await openDB();
  const userId = req.session.userId;

  const solvedSubmissions = await db.all(
    `SELECT DISTINCT problem_id FROM submissions
    WHERE user_id = ? AND status = ?`,
    [userId, "AC"]
  );

  const solvedProblemIds = new Set(
    solvedSubmissions.map((sub) => sub.problem_id)
  );

  const allProblems = await db.all(
    `SELECT problem_id, title, score FROM problems ORDER BY created_at DESC`
  );

  const problemsWithStatus = allProblems.map((problem) => ({
    ...problem,
    isSolved: solvedProblemIds.has(problem.problem_id),
  }));

  res.json(problemsWithStatus);
});

router.get("/problem", async (req, res) => {
  const id = req.query.id;
  const Problems = path.resolve(__dirname, "..");
  const folder = path.join(Problems, "problems", id);
  const db = await openDB();

  try {
    const [configData, mdData] = await Promise.all([
      db.get("SELECT * FROM problems WHERE problem_id = ?", [id]),
      fs.promises.readFile(path.join(folder, "statement.md"), "utf-8"),
    ]);

    res.json({ ...configData, statement: mdData });
  } catch {
    res.json({ error: "Problem not found" });
  }
});

router.get("/problem/:id", loginCheck, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/problem.html"));
});

export default router;
