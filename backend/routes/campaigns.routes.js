const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const mapCampaign = (row) => ({
  id:          row.id,
  title:       row.title,
  description: row.description,
  target:      Number(row.target),
  startDate:   row.start_date  || null,
  endDate:     row.end_date    || null,
  status:      row.status,
  sponsor:     row.sponsor     || null,
  department:  row.department  || null,
});

// ── GET all campaigns ─────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM campaigns ORDER BY created_at DESC"
    );
    res.json(rows.map(mapCampaign));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET single campaign ───────────────────────────────────────────────────────
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

// ── GET donors linked to a campaign ──────────────────────────────────────────
router.get("/:id/donors", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM donors WHERE campaign_id = ? ORDER BY id DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /campaigns/:id/donors error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST create campaign ──────────────────────────────────────────────────────
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, description, target, startDate, endDate, status, sponsor, department } = req.body;

   if (!title) {
  return res.status(400).json({ message: "title is required" });
}

    const [result] = await pool.query(
      `INSERT INTO campaigns (title, description, target, start_date, end_date, status, sponsor, department)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        Number(target || 0),
        startDate   || null,
        endDate,
        status      || "Active",
        sponsor     || null,
        department  || null,
      ]
    );

    const [rows] = await pool.query("SELECT * FROM campaigns WHERE id = ?", [result.insertId]);
    res.status(201).json(mapCampaign(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ── PUT update campaign ───────────────────────────────────────────────────────
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { title, description, target, startDate, endDate, status, sponsor, department } = req.body;

    const [result] = await pool.query(
      `UPDATE campaigns
       SET title=?, description=?, target=?, start_date=?, end_date=?, status=?, sponsor=?, department=?
       WHERE id=?`,
      [
        title,
        description || null,
        Number(target || 0),
        startDate   || null,
        endDate,
        status      || "Active",
        sponsor     || null,
        department  || null,
        req.params.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Not found" });
    }

    const [rows] = await pool.query("SELECT * FROM campaigns WHERE id = ?", [req.params.id]);
    res.json(mapCampaign(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ── DELETE campaign ───────────────────────────────────────────────────────────
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