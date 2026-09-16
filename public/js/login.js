const form = document.querySelector("form");
const msg = document.getElementById("form-msg");

document.getElementById("login-form").onsubmit = async function (e) {
  e.preventDefault();
  msg.textContent = "";

  const formData = new FormData(e.target);
  const formDataObj = {
    username: formData.get("username"),
    password: formData.get("password"),
  };

  const res = await fetch("login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formDataObj),
  });
  const result = await res.json();
  if (result.success) {
    window.location.href = "/dashboard";
  } else {
    msg.textContent = result.message || "Đăng nhập thất bại.";
    msg.style.color = "var(--danger)";
  }
};
