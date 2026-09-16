async function loadHistory() {
  const historyList = document.getElementById("history-list");
  try {
    const res = await fetch("/history");
    const data = await res.json();

    const historys = data.history;
    historyList.innerHTML = "";
    historys.forEach((sub) => {
      const li = document.createElement("li");
      li.className = "history-item card";

      const shortTitle =
        sub.title.length > 13 ? sub.title.slice(0, 13) + ". . ." : sub.title;

      sub.submission_score =
        sub.submission_score == null ? 0 : sub.submission_score;

      const titleP = document.createElement("p");
      titleP.textContent = shortTitle;

      const scoreP = document.createElement("p");
      if (sub.status !== "Pending") {
        scoreP.textContent = `${sub.submission_score}/${sub.problem_score}`;
      }

      const statusP = document.createElement("p");
      statusP.textContent = sub.status;
      statusP.className = "history-status";
      statusP.style.color = "white";

      switch (sub.status) {
        case "AC":
          statusP.style.backgroundColor = "var(--success)";
          break;
        case "WA":
          statusP.style.backgroundColor = "red";
          break;
        case "MLE":
        case "TLE":
          statusP.style.backgroundColor = "gray";
          break;
        case "Pending":
          statusP.style.backgroundColor = "var(--accent)";
          statusP.textContent = "...Đang chấm";
          break;
        default:
          statusP.style.backgroundColor = "orange";
      }

      li.appendChild(titleP);
      if (sub.status != "Pending") li.appendChild(scoreP);
      li.appendChild(statusP);

      li.onclick = () => {
        window.open(`/submission/${sub.id}`, "_blank", "noopener,noreferrer");
      };
      historyList.appendChild(li);
    });
  } catch (error) {
    window.alert("Lỗi khi tải lịch sử nộp bài: ", error);
    console.log(error);
  }
}

async function loadUserInfo() {
  const solvedProblems = document.getElementById("solved-problems");
  const totalScore = document.getElementById("total-score");
  const totalSubmissions = document.getElementById("total-sub");
  const username = document.getElementById("username");
  const avatar = document.getElementById("avatar");

  try {
    const res = await fetch("/userinfo");
    const data = await res.json();

    console.log(data);

    avatar.innerText = data.username[0];
    username.innerText = `Xin chào, ${data.username}!`;
    solvedProblems.innerText = `Số bài đã giải: ${data.solvedProblems}`;
    totalScore.innerText = `Tổng điểm: ${
      data.totalScore != null ? data.totalScore : 0
    }`;
    totalSubmissions.innerText = `Tổng số lần nộp: ${data.totalSubmissions}`;
  } catch (error) {
    window.alert("Lỗi khi tải thông tin người dùng: ", error);
    console.log(error);
  }
}

export { loadHistory, loadUserInfo };
