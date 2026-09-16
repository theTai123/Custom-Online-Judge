const msg = document.getElementById("form-msg");
(function () {
  const form = document.getElementById("register-form");
  const pw = document.getElementById("pw");
  const pw2 = document.getElementById("pw2");
  const username = document.getElementById("username");

  function checkMatch() {
    if (!pw.value && !pw2.value) {
      msg.textContent = "";
      return false;
    }
    if (pw.value !== pw2.value) {
      msg.textContent = "Mật khẩu không khớp.";
      return false;
    }
    if (pw.value.length < 6) {
      msg.textContent = "Mật khẩu phải có ít nhất 6 ký tự.";
      return false;
    }

    if (/\s/.test(pw.value)) {
      msg.textContent = "Mật khẩu không được chứa khoảng trắng.";
      return false;
    }

    if (/[^\x20-\x7E]/.test(pw.value)) {
      msg.textContent = "Mật khẩu chỉ được chứa ký tự ASCII.";
      return false;
    }

    if (username.value.length < 3) {
      msg.textContent = "Tên đăng nhập phải có ít nhất 3 ký tự.";
      return false;
    }

    if (username.value.length > 20) {
      msg.textContent = "Tên đăng nhập không được vượt quá 20 ký tự.";
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username.value)) {
      msg.textContent =
        "Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới.";
      return false;
    }

    msg.textContent = "";
    return true;
  }

  username.addEventListener("input", checkMatch);
  pw.addEventListener("input", checkMatch);
  pw2.addEventListener("input", checkMatch);

  form.addEventListener("submit", function (e) {
    if (!checkMatch()) {
      e.preventDefault();
      pw.focus();
    } else {
      submit(e);
    }
  });
})();

async function submit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const formDataObj = {
    username: formData.get("username"),
    password: formData.get("password"),
  };

  const res = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formDataObj),
  });
  const data = await res.json();

  msg.textContent = data.message;
  if (data.success) {
    msg.style.color = "green";
    alert("Đăng ký thành công! Vui lòng đăng nhập.");
    window.location.href = "/login";
  }
}
