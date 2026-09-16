const submissionId = window.location.pathname.split("/").pop();

function toFullVerdict(verdict) {
  switch (verdict) {
    case "AC":
      return "Kết quả đúng";
    case "WA":
      return "Sai kết quả";
    case "RTE":
      return "Lỗi khi chạy";
    case "TLE":
      return "Vượt giới hạn thời gian";
    case "MTE":
      return "Vượt giới hạn bộ nhớ";
    case "CE":
      return "Lỗi biên dịch";
    case "Pending":
      return "Đang chấm";
  }
}

function getColor(verdict) {
  switch (verdict) {
    case "AC":
      return "var(--success)";
    case "WA":
      return "red";
    case "MLE":
    case "TLE":
      return "gray";
    case "Pending":
      return "var(--accent)";
    default:
      return "orange";
  }
}

function formatDate(date) {
  const isoString = date.replace(" ", "T") + "Z";
  const newDate = new Date(isoString);

  const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const timePart = timeFormatter.format(newDate);

  const dateformatter = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const datePart = dateformatter.format(newDate);

  const finalFormattedString = `${timePart}, ${datePart.replace(
    ",",
    ", ngày",
  )}`;

  return finalFormattedString;
}

function loadCode(__code) {
  const showCode = document.getElementById("show-code");
  const codeBody = document.getElementById("code-body");
  const codeBlock = document.getElementById("code");

  codeBlock.textContent = __code;

  Prism.highlightElement(codeBlock);

  showCode.addEventListener("click", () => {
    codeBody.classList.toggle("hidden");
  });
}

async function loadSubmission() {
  const submission_id = document.getElementById("submission-id");
  const problemTitle = document.getElementById("problem-title");
  const username = document.getElementById("username");
  const timestamp = document.getElementById("timestamp");
  const overallStatus = document.getElementById("overall-status");
  const totalScore = document.getElementById("total-score");
  const problemScore = document.getElementById("problem-score");
  const execTime = document.getElementById("exec-time");
  const memoryUsage = document.getElementById("memory-usage");

  const errorLog = document.getElementById("error");

  const testCasesBody = document.getElementById("test-cases-body");

  try {
    const res = await fetch(`/submission?id=${submissionId}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Lỗi khi tải bài nộp!");
      return;
    }

    const fullVerdict = toFullVerdict(data.status);
    const verdictColor = getColor(data.status);

    submission_id.innerText = data.id;
    problemTitle.innerText = data.problem_title;
    username.innerText = data.username;

    timestamp.innerText = formatDate(data.created_at);

    overallStatus.innerText = fullVerdict;
    overallStatus.style.color = verdictColor;

    totalScore.innerText =
      data.submission_score != null ? data.submission_score : "__";
    totalScore.style.color = verdictColor;
    problemScore.innerText = `/${data.problem_score}`;

    if (data.status != "Pending") {
      const final = data.details.at(-1);
      let time =
        final.final_verdict == "TLE"
          ? "__"
          : (final.total_time_ms / 1000).toFixed(2);
      let memory =
        final.final_verdict == "MLE"
          ? "__"
          : (final.peak_memory_kb / 1024).toFixed(2);

      time = time === "NaN" ? "__" : time;
      memory = memory === "NaN" ? "__" : memory;

      execTime.innerText = `${time} giây`;
      memoryUsage.innerText = `${memory}MB`;
    }

    errorLog.style.display = "None";

    if (data.status == "CE") {
      const final = data.details.at(-1);

      errorLog.textContent = final.error;
      errorLog.style.display = "Block";
      console.log(final.error);
    }

    if (data.details) {
      const testCases = data.details.slice(0, -1);
      testCasesBody.innerHTML = "";

      testCases.forEach((testcase) => {
        const tr = document.createElement("tr");
        tr.className = "card";
        tr.innerHTML = `
          <td>Test ${testcase.test_case}</td>
          <td style="color: ${getColor(testcase.verdict)};">${toFullVerdict(
            testcase.verdict,
          )}</td>
          <td>${
            (testcase.verdict == "TLE" ? ">" : "") + testcase.time_ms
          }ms</td>
          <td>${
            (testcase.verdict == "MLE" ? ">" : "") + testcase.memory_kb
          }KB</td>
          `;

        testCasesBody.appendChild(tr);
      });
    }

    loadCode(data.code);
  } catch (error) {
    window.alert("Lỗi khi tải bài nộp: " + error);
    console.log(error);
  }
}

loadSubmission();
