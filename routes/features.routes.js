const express = require("express");
const router = express.Router();

const featuresController = require("../controllers/feature.controller");
const admin = require("../middlewares/admin.middleware");
const auth = require("../middlewares/auth.middleware");

// GET all features
router.get("/", auth, featuresController.listAllFeatures);

// GET feature by id
router.get("/:id", auth, featuresController.getFeature);

// CREATE feature
router.post("/", [auth, admin], featuresController.createFeature);

// Update feature
router.put("/:id", [auth, admin], featuresController.updateFeature);

// DELETE feature
router.delete("/:id", [auth, admin], featuresController.deleteFeature);

module.exports = router;
