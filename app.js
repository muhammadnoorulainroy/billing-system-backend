const config = require("config");
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");

const authRouter = require("./routes/auth.routers");
const featuresRouter = require("./routes/features.routes");
const plansRouter = require("./routes/plans.routes");
const subscriptionsRouter = require("./routes/subscriptions.routes");

const app = express();

if (
  !config.get("jwtSecretKey") ||
  !config.get("stripePublickey") ||
  !config.get("stripeSecretkey")
)
  console.error("FATAL ERROR: one or more env variables are not defined");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRouter);
app.use("/api/features", featuresRouter);
app.use("/api/plans", plansRouter);
app.use("/api/subscriptions", subscriptionsRouter);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
