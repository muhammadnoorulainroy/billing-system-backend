const express = require("express");
const router = express.Router();

const admin = require("../middlewares/admin.middleware");
const auth = require("../middlewares/auth.middleware");
const plansController = require("../controllers/plans.controller");

// GET all plans
router.get("/", auth, plansController.getAllPlans);

// GET plan by id
router.get("/:id", auth, plansController.getPlan);

// GET features of a plan
router.get("/:id/features", auth, plansController.getAllFeaturesOfPlan);

// CREATE plan
router.post("/", [auth, admin], plansController.createPlan);

// // DELETE plan
router.delete("/:id", [auth, admin], plansController.deletePlan);

module.exports = router;
