function loginCheck(req, res, next) {
  if (req.session.authenticated) {
    next();
  } else {
    if (req.accepts("html")) {
      res.redirect("/login");
    } else {
      res.send({ redirect: "/login" });
    }
  }
}

function notLoginCheck(req, res, next) {
  if (!req.session.authenticated) {
    next();
  } else {
    if (req.accepts("html")) {
      res.redirect("/dashboard");
    } else {
      res.send({ redirect: "/dashboard" });
    }
  }
}

export { loginCheck, notLoginCheck };
