import fs from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { openDB } from "../database/db.js";
import path, { resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const errorPath = __dirname + "/sandbox/compile_error.log";
const outputPath = __dirname + "/sandbox/output.json";

function getProblemPath(problemId) {
  return `./problems/${problemId}/`;
}

let submissionQueue = [];
let isGrading = false;

function addSubmission(submissionId) {
  submissionQueue.push(submissionId);
  runNextSubmission();
}

async function runNextSubmission() {
  if (isGrading) return;
  isGrading = true;

  while (submissionQueue.length > 0) {
    const submissionId = submissionQueue.shift();

    await gradeSubmission(submissionId);
  }

  isGrading = false;
}

async function gradeSubmission(submissionId) {
  return new Promise(async (res, rej) => {
    try {
      const db = await openDB();
      const data = await db.get("SELECT * FROM submissions WHERE id = ?", [
        submissionId,
      ]);

      const config = await db.get(
        "SELECT * FROM problems WHERE problem_id = ?",
        [data.problem_id],
      );

      const submissionPath = resolve(
        path.join("./uploads", data.filename + ".cpp"),
      );
      const problemTestPath = resolve(
        path.join(getProblemPath(data.problem_id), "tests"),
      );

      const grader = spawn(
        "runner.exe",
        [
          submissionPath,
          problemTestPath,
          config.time_limit,
          config.memory_limit,
        ],
        {
          cwd: __dirname,
          stdio: ["ignore", "pipe", "pipe"],
        },
      );

      fs.writeFileSync(errorPath, "");

      grader.stderr.on("data", (data) => {
        console.error("Có lỗi từ runner");
        const error = data.toString();
        const cleanedError = error
          .split("\n")
          .map((line) => line.replace(/^[A-Z]:[\\/][^:]+:\s*/, "")) // xóa phần "filename:"
          .join("\n");
        fs.appendFileSync(errorPath, cleanedError);
      });

      grader.on("close", () => {
        fs.readFile(outputPath, "utf8", (err, data) => {
          if (err) {
            console.error("Không đọc được file kết quả");
            rej(err);
          }
          try {
            const results = JSON.parse(data);
            updateSubmission(submissionId, results, config);
            res();
          } catch (error) {
            console.error("JSON lỗi");
            rej(error);
          }
        });
      });
    } catch (error) {
      console.error(error);
      rej(error);
    }
  });
}

async function updateSubmission(submissionId, data, config) {
  const db = await openDB();

  const final = data.at(-1);
  const status = final.fv;
  let score = (final.ac / config.num_of_tests) * config.score;
  let details = data;

  if (status == "CE") {
    score = 0;
    const errorLog = await fs.promises.readFile(errorPath, "utf-8");

    details[0].error = errorLog;
  }

  details = JSON.stringify(details);

  await db.run(
    `UPDATE submissions
    SET score = ?, status = ?, details = ?
    WHERE id = ?`,
    [score, status, details, submissionId],
  );
}

export { addSubmission };
