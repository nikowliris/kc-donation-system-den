const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const mapCampaign = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  target: Number(row.target),
  endDate: row.end_date,
  status: row.status,
});


router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM campaigns ORDER BY created_at DESC");
    res.json(rows.map(mapCampaign));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM campaigns WHERE id = ?",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    res.json(mapCampaign(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, description, target, endDate, status } = req.body;

    if (!title || !description || !endDate) {
      return res.status(400).json({
        message: "title, description, endDate are required",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO campaigns (title, description, target, end_date, status)
       VALUES (?, ?, ?, ?, ?)`,
      [title, description, Number(target || 0), endDate, status || "Active"]
    );

    const [rows] = await pool.query(
      "SELECT * FROM campaigns WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json(mapCampaign(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { title, description, target, endDate, status } = req.body;

    const [result] = await pool.query(
      `UPDATE campaigns
       SET title=?, description=?, target=?, end_date=?, status=?
       WHERE id=?`,
      [title, description, Number(target || 0), endDate, status || "Active", req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Not found" });
    }

    const [rows] = await pool.query(
      "SELECT * FROM campaigns WHERE id = ?",
      [req.params.id]
    );

    res.json(mapCampaign(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM campaigns WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;