const jwt = require("jsonwebtoken");
const config = require("config");
const stripe = require("stripe")(config.get("stripeSecretkey"));
const bcrypt = require("bcrypt");

const pool = require("../config/db.config");

const { validateSignupData, validateLoginData } = require("../validations");

const login = async (req, res) => {
  const { email, password } = req.body;
  const { error } = validateLoginData(req.body); // validate request body
  if (error) return res.status(400).json({ error: error.details[0].message }); // if request body contains invalid data, send error

  try {
    //check if user exists
    const { rows, rowCount } = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (!rowCount)
      return res.status(400).json({ error: "Invalid email or password" }); // if user is not registered, send appropriate msg

    const user = rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password); // decrypt the password and compare
    if (!isValidPassword) return res.status(400).json({ error: "Invalid email or password" });

    const token = generateAuthToken(user);

    res.status(200).json(token);
  } catch (error) {
    res.json(error.message);
  }
}

const signup = async (req, res) => {
  const { fullname, email, password, role } = req.body;

  const { error } = validateSignupData(req.body); // validate request body
  if (error) return res.status(400).json({ error: error.details[0].message }); // if request body contains invalid data, send error

  try {
    //check if user already registered
    const { rowCount } = await pool.query("SELECT * FROM users WHERE email=$1",[email]);
    if (rowCount) return res.status(400).json({error: "User already exists" }); // if user already registered, send appropriate msg

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt); // encrypt the password

    //register user on stripe
    const customer = await stripe.customers.create({ name: fullname, email, });

    //save user in the database
    const { rows } = await pool.query(
      "INSERT into users (fullname, email, password, role, stripe_id) VALUES ($1, $2, $3, $4, $5) RETURNING fullname, email, role, stripe_id",
      [fullname, email, hashedPassword, role, customer.id]
    );
    const user = rows[0];
    const token = generateAuthToken(user);
    res.status(200).json({token, message: "user has been registered successfully" });
  } catch (error) {
    res.json(error.message);
  }
}

const generateAuthToken = user =>{
  const token = jwt.sign(
    {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      stripe_id: user.stripe_id,
      role: user.role,
    },
    config.get("jwtSecretKey")
  );
  return token;
}

module.exports = {login, signup}
