const Joi = require("joi");
const config = require("config");
const stripe = require("stripe")(config.get("stripeSecretkey"));

const pool = require("../config/db.config");

// GET all plans
const getAllPlans = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM plans");
    res.status(200).json({ data: rows });
  } catch (error) {
    res.json({ error });
  }
};

// GET plan by id
const getPlan = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows, rowCount } = await pool.query(
      "SELECT * FROM plans WHERE id = $1",
      [id]
    );
    if (!rowCount) return res.status(404).json({ error: "plan not found" });

    res.status(200).json({ data: rows });
  } catch (error) {
    res.json({ error });
  }
};

// GET all features of a plan
const getAllFeaturesOfPlan = async (req, res) => {
  const { id } = req.params;
  try {
    const query =
      "SELECT name, unit_price, max_unit_limit FROM features INNER JOIN features_plans ON features.id = features_plans.feature_id";
    const { rows } = await pool.query(query);
    res.status(200).json({ data: rows });
  } catch (error) {
    res.json({ error });
  }
};

// CREATE a plan
const createPlan = async (req, res) => {
  const { error } = validatePlanData(req.body); // validate if body contains required values
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { name, featureIDs } = req.body;
  try {
    const { rowCount } = await pool.query("SELECT * FROM plans WHERE name = $1", [name]); // check for duplicate name
    if (rowCount) return res.status(400).json({ error: `Plan '${name}' already exists` });

    const client = await pool.connect();
    const planPrice = await calculatePlanPrice(featureIDs);
    const { id } = await createStripePlan(planPrice, name);
    try {
      await client.query("BEGIN"); // execute a transaction
      const { rows } = await client.query(
        "INSERT INTO plans (name, price, stripe_price_id) VALUES ($1, $2, $3) RETURNING *",
        [name, planPrice, id]
      );
      featureIDs.forEach(async (featureId) => {
        await client.query(
          "INSERT INTO features_plans (feature_id, plan_id) VALUES ($1, $2)",
          [featureId, rows[0].id]
        );
      });
      await client.query("COMMIT"); // commit the transaction

      res.status(201).json({ message: "Plan created successfully", data: rows });
    } catch (error) {
      await client.query("ROLLBACK");
      res.json({ error });
    } finally {
      client.release();
    }
  } catch (error) {
    res.json({ error });
  }
};

// delete plan
const deletePlan = async (req, res) => {
  const { id } = req.params;
  const { rows, rowCount } = await pool.query("SELECT * FROM plans WHERE id=$1", [id]);
  if (!rowCount) return res.status(400).json({ error: "Plan does not exist" });

  try {
    await stripe.plans.del(rows[0].stripe_price_id);
    await pool.query("DELETE FROM plans WHERE id=$1", [id]);
    res.json({ message: "Plan deleted successfully" });
  } catch (error) {
    res.json({ error: error.message });
  }
};

const calculatePlanPrice = async (featureIDs) => {
  return new Promise((resolve, reject) => {
    let price = 0;
    featureIDs.forEach(async (id, index) => {
      var { rows } = await pool.query(
        "SELECT unit_price FROM features WHERE id = $1",
        [id]
      );
      price = price + rows[0].unit_price;
      if (featureIDs.length - 1 == index) resolve(price);
    });
  });
};

const createStripePlan = async (price, name) => {
  return await stripe.prices.create({
    unit_amount: price * 100,
    currency: "usd",
    recurring: { interval: "month" },
    product_data: { name },
  });
};

const validatePlanData = (data) => {
  const featureSchema = Joi.object({
    name: Joi.string().min(3).max(25).trim().required(),
    featureIDs: Joi.array().min(1).required(),
  });
  return featureSchema.validate(data);
};

module.exports = {
  getAllPlans,
  getPlan,
  getAllFeaturesOfPlan,
  createPlan,
  deletePlan
};
