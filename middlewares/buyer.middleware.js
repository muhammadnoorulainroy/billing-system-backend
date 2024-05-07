module.exports = function (req, res, next) {
  if (req.user.role !== "buyer")
    return res.status(403).json({ error: "Access denied" });

  next();
};
