const Joi = require("joi");
const config = require("config");
const stripe = require("stripe")(config.get("stripeSecretkey"));

const pool = require("../config/db.config");

// GET all subscriptions
const getAllSubscriptions = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM subscriptions WHERE isActive=true"
    );

    res.json({ data: rows });
  } catch (error) {
    res.json({ error });
  }
};

// CREATE subscription
const createSubscription = async (req, res) => {
  const { userId, planId } = req.params;
  const { userStripeId, cardInfo } = req.body;
  const { rows } = await pool.query(
    "SELECT stripe_price_id FROM plans WHERE id=$1",
    [planId]
  );
  const planStripeId = rows[0].stripe_price_id;
  console.log(planStripeId);
  createSource(userStripeId, cardInfo);
  const stripeSubscription = await createSubscriptionOnStripe(
    userStripeId,
    planStripeId
  );
  const newSubscription = await pool.query(
    "INSERT INTO subscriptions (user_id, plan_id, stripe_id, is_active) VALUES ($1, $2, $3, $4)",
    [userId, planId, stripeSubscription.id, true]
  );

  res.json({ message: "Subscription created successfully" });
};

const createSubscriptionOnStripe = async (userStripeId, planStripeId) => {
  return await stripe.subscriptions.create({
    customer: userStripeId,
    items: [{ price: planStripeId }],
  });
};

// cancel subscription
const cancelSubscription = async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    "SELECT stripe_id FROM subscriptions WHERE id=$1",
    [id]
  );
  stripe.subscriptions
    .del(rows[0].stripe_id)
    .then(() => {
      pool
        .query("UPDATE subscriptions SET is_active=$1 WHERE id=$2", [false, id])
        .then(() =>
          res.json({ message: "Subscription cancelled successfully" })
        )
        .catch((error) => {
          res.json({ error });
        });
    })
    .catch((error) => {
      res.json({ error });
    });
};

const createSource = async (userStripeId, cardInfo) => {
  const token = await generateToken(cardInfo);
  const source = await stripe.customers.createSource(userStripeId, {
    source: token.id,
  });
};

const generateToken = async (cardInfo) => {
  return await stripe.tokens.create({
    card: {
      number: cardInfo.number,
      exp_month: cardInfo.expMonth,
      exp_year: cardInfo.expYear,
      cvc: cardInfo.cvc,
    },
  });
};

module.exports = {
  getAllSubscriptions,
  createSubscription,
  cancelSubscription,
};
