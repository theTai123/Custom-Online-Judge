import { loadHistory, loadUserInfo } from "./info.js";

const problemsList = document.getElementById("problem-list");

async function loadProblems() {
  try {
    const res = await fetch("/problems");
    const problems = await res.json();

    console.log(problems);

    if (problems.length === 0) {
      problemsList.innerHTML = "<p>Chưa có bài nào.</p>";
      return;
    }
    problemsList.innerHTML = "";
    problems.forEach((problem) => {
      const li = document.createElement("li");
      li.className = "problem-item";
      li.innerHTML = `<p style="width: 50%;">${problem.title}</p>
                      <p>${problem.score} Điểm</p>`;

      const div = document.createElement("div");
      div.className = "problem-status";
      div.style.backgroundColor = problem.isSolved ? "var(--success)" : "White";
      li.appendChild(div);
      li.onclick = () => {
        window.location.href = `/problem/${problem.problem_id}`;
      };
      problemsList.appendChild(li);
    });
  } catch (error) {
    window.alert("Lỗi khi tải danh sách bài: " + error.message);
  }
}

loadProblems();
loadHistory();
loadUserInfo();
