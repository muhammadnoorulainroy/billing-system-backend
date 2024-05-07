const express = require("express");
const router = express.Router();

const admin = require("../middlewares/admin.middleware");
const auth = require("../middlewares/auth.middleware");
const buyer = require("../middlewares/buyer.middleware");
const subscriptionController = require("../controllers/subscriptions.controller");

// GET all subscriptions
router.get("/", [auth, admin], subscriptionController.getAllSubscriptions);

// CREATE subscription
router.post("/:userId/:planId", [auth, buyer], subscriptionController.createSubscription);

// DELETE subscription
router.delete("/:id", [auth, buyer], subscriptionController.cancelSubscription);

module.exports = router;
