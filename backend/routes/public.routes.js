const express = require("express");
const router = express.Router();
const pool = require("../config/db");

const mapEvent = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  date: row.date,
  time: row.time,
  goal: Number(row.goal || 0),
  status: row.status,
  image: row.image ? `http://localhost:5001/uploads/${row.image}` : null,
});

const mapCampaign = (row) => ({
  id: row.id,
  title: row.title,
  category: 'Campaign',
  description: row.description,
  target: Number(row.target || 0),
  raised: 0,
  endDate: row.end_date,
  status: row.status,
  image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=800',
});


router.get("/events", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM events ORDER BY date ASC");
    res.json(rows.map(mapEvent));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/campaigns", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM campaigns ORDER BY created_at DESC");
    res.json(rows.map(mapCampaign));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;