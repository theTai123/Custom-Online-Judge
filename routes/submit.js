import express from "express";
import path from "path";
import multer from "multer";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { openDB } from "../database/db.js";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

import { loginCheck } from "../middleware/authCheck.js";
import { addSubmission } from "../judge/grader.js";

const keyMap = {
  tc: "test_case",
  v: "verdict",
  fv: "final_verdict",
  t: "time_ms",
  m: "memory_kb",
  tt: "total_time_ms",
  pm: "peak_memory_kb",
  ac: "accepted",
};

function expandObjectKeys(shortObject) {
  const fullObject = {};

  for (const shortKey in shortObject) {
    if (Object.prototype.hasOwnProperty.call(shortObject, shortKey)) {
      const fullKey = keyMap[shortKey] || shortKey;

      fullObject[fullKey] = shortObject[shortKey];
    }
  }

  return fullObject;
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const submissionId = crypto.randomBytes(16).toString("hex") + ".cpp";
    cb(null, submissionId);
  },
});

const upload = multer({ storage: storage });

router.post(
  "/submit",
  loginCheck,
  upload.single("fileToUpload"),
  async (req, res) => {
    const submissionName = path.parse(req.file.filename).name;
    const username = req.session.username;
    const problemId = req.query.id;

    const db = await openDB();

    const data = await db.get("SELECT id FROM users WHERE username = ?", [
      username,
    ]);

    const userId = await data.id;
    const result = await db.run(
      "INSERT INTO submissions (user_id, problem_id, filename) VALUES(?,?,?)",
      [userId, problemId, submissionName],
    );

    const submissionId = result.lastID;
    addSubmission(submissionId);

    res.json({
      success: true,
      message: `Nộp bài thành công!`,
    });
  },
);

router.get("/submission", async (req, res) => {
  if (!req.query.id) {
    return res.status(400).json({ error: "Submission ID is required." });
  }

  const db = await openDB();

  const submissionId = req.query.id;

  const submissionInfo = await db.get(
    `
    SELECT
      s.id,
      s.status,
      s.created_at,
      s.details,
      s.score AS submission_score,
      s.filename,
      u.username,
      u.id AS user_id,
      p.title AS problem_title,
      p.score AS problem_score
    FROM
      submissions s
    JOIN
      users u ON s.user_id = u.id
    JOIN
      problems p ON s.problem_id = p.problem_id
    WHERE s.id = ?;
    `,
    [submissionId],
  );

  if (submissionInfo.user_id !== req.session.userId && !req.session.isAdmin) {
    return res
      .status(403)
      .json({ error: "Bạn không có quyền xem bài nộp này." });
  }

  const codePath = path.join(
    __dirname,
    "..",
    "uploads",
    submissionInfo.filename + ".cpp",
  );

  const code = await fs.promises.readFile(codePath, "utf-8");

  submissionInfo.code = code;

  submissionInfo.details = JSON.parse(submissionInfo.details);

  if (submissionInfo.details) {
    submissionInfo.details = submissionInfo.details.map((shortResult) =>
      expandObjectKeys(shortResult),
    );
  }

  res.json(submissionInfo);
});

router.get("/submission/:id", loginCheck, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/submission.html"));
});

export default router;
