const Joi = require("joi");

const pool = require("../config/db.config");

const listAllFeatures = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM features");
    res.json({ data: rows });
  } catch (error) {
    res.json({ error });
  }
};

const getFeature = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows, rowCount } = await pool.query(
      "SELECT * FROM features WHERE id = $1",
      [id]
    );
    if (!rowCount) return res.status(400).json({ error: "Feature not found" });

    res.json({ data: rows });
  } catch (error) {
    res.json({ error });
  }
};

const createFeature = async (req, res) => {
  const { error } = validateFeatureData(req.body);
  if (error) return res.status(400).json({ error });

  const { name, unitPrice, maxUnitLimit } = req.body;
  try {
    const { rowCount } = await pool.query(
      "SELECT * FROM features WHERE name = $1",
      [name]
    );
    if (rowCount)
      return res
        .status(400)
        .json({ error: `Feature '${name}' already exists` });

    const { rows } = await pool.query(
      "INSERT INTO features (name, unit_price, max_unit_limit) VALUES ($1, $2, $3) RETURNING *",
      [name, unitPrice, maxUnitLimit]
    );

    res.json({ message: "Feature created successfully", data: rows });
  } catch (error) {
    res.json({ error });
  }
};

const updateFeature = async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query(
      "SELECT * FROM features WHERE id = $1",
      [id]
    );
    if (!rowCount) return res.status(400).json({ error: "Feature not found" });

    const { name, unitPrice, maxUnitLimit } = req.body;

    const { rows } = await pool.query(
      "UPDATE features SET name = $1, unit_price = $2, max_unit_limit = $3 WHERE id=$4 RETURNING *",
      [name, unitPrice, maxUnitLimit, id]
    );

    res.json({ message: "Feature updated successfully", data: rows });
  } catch (error) {
    res.json({ error });
  }
};

const deleteFeature = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM features WHERE id = $1", [id]);

    res.json({ message: `Feature with id ${id} deleted successfully` });
  } catch (error) {
    res.json({ error });
  }
};

const validateFeatureData = (data) => {
  const featureSchema = Joi.object({
    name: Joi.string().min(3).max(25).trim().required(),
    unitPrice: Joi.number().min(0).max(1000000).required(),
    maxUnitLimit: Joi.number().min(5).max(1000),
  });
  return featureSchema.validate(data);
};
module.exports = {
  listAllFeatures,
  getFeature,
  createFeature,
  updateFeature,
  deleteFeature,
};
