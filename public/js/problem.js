import { loadHistory, loadUserInfo } from "./info.js";

const submit = document.getElementById("submit-form");
const problem_id = window.location.pathname.split("/").pop();

const title = document.getElementById("title");
const memory = document.getElementById("memory");
const time = document.getElementById("time");
const problemDetail = document.getElementById("problem-detail");

const MAX_FILE_SIZE = 100 * 1024; //100KB

async function loadProblem() {
  const res = await fetch(`/problem?id=${problem_id}`);
  const data = await res.json();

  if (data.error) {
    alert(data.error);
  }

  title.innerText = data.title;
  memory.innerHTML = `Giới hạn bộ nhớ: ${data.memory_limit}MB`;
  time.innerHTML = `Giới hạn thời gian: ${data.time_limit / 1000} Giây`;

  const html = marked.parse(data.statement);
  problemDetail.innerHTML = html;

  await MathJax.typesetPromise([problemDetail]);
}

submit.onsubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData(submit);

  for (const [key, value] of formData.entries()) {
    if (value instanceof File && value.name !== "") {
      if (value.size > MAX_FILE_SIZE) {
        alert(
          `File "${value.name}" vượt quá dung lượng cho phép (tối đa 100KB)!`,
        );
        return;
      }
    }
  }

  const res = await fetch(`/submit?id=${problem_id}`, {
    method: "POST",
    body: formData,
  });
  const result = await res.json();
  if (result.success) {
    window.location.reload();
  } else {
    alert("Nộp bài thất bại!");
  }
};

loadProblem();
loadHistory();
loadUserInfo();

const returnBtn = document.getElementById("return-btn");
returnBtn.onclick = () => {
  window.history.back();
};
