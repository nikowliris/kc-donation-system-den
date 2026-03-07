const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const mapDonation = (row) => ({
  id: row.id,
  donor: row.donor,
  amount: Number(row.amount),
  type: row.type,
  campaign: row.campaign,
  channel: row.channel,
  status: row.status,
  notes: row.notes || "",
  date: row.date ? new Date(row.date).toISOString().split("T")[0] : null,
});

async function getUserName(userId) {
  const [rows] = await pool.query("SELECT name FROM users WHERE id = ?", [userId]);
  return rows.length ? rows[0].name : null;
}

// ─── GET public campaign stats — no auth required ─────────────────────────────
router.get("/public/stats", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT campaign, SUM(amount) as raised, COUNT(*) as count
       FROM donations WHERE status = 'Completed'
       GROUP BY campaign`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── GET all — admin only ─────────────────────────────────────────────────────
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM donations ORDER BY date DESC");
    res.json(rows.map(mapDonation));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── GET own donations — any logged in user ───────────────────────────────────
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const donorName = await getUserName(req.user.userId);
    if (!donorName) return res.status(404).json({ message: "User not found" });

    const [rows] = await pool.query(
      "SELECT * FROM donations WHERE donor = ? ORDER BY date DESC",
      [donorName]
    );
    res.json(rows.map(mapDonation));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── GET one — admin only ─────────────────────────────────────────────────────
router.get("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM donations WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    res.json(mapDonation(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── POST (user portal donation) — public, login optional ────────────────────
router.post("/", async (req, res) => {
  try {
    const { amount, type, campaign, campaignId, channel, notes } = req.body;

    // Resolve campaign name from ID if provided — guarantees exact title match
    let campaignName = campaign;
    if (campaignId) {
      const [campRows] = await pool.query(
        "SELECT title FROM campaigns WHERE id = ?",
        [campaignId]
      );
      if (campRows.length) {
        campaignName = campRows[0].title;
      }
    }

    if (!amount || !campaignName) {
      return res.status(400).json({ message: "amount and campaign are required" });
    }

    // Resolve donor name from JWT if present
    let donor = "Anonymous";
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (token) {
      try {
        const payload = require("jsonwebtoken").verify(token, process.env.JWT_SECRET);
        const name = await getUserName(payload.userId);
        if (name) donor = name;
      } catch (_) {
        // invalid token — fall back to Anonymous
      }
    }

    const date = new Date().toISOString().split("T")[0];

    const [result] = await pool.query(
      `INSERT INTO donations (donor, amount, type, campaign, channel, status, notes, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        donor,
        Number(amount),
        type || "One-time",
        campaignName,
        channel || "Online",
        "Completed",
        notes || "",
        date,
      ]
    );

    const [rows] = await pool.query("SELECT * FROM donations WHERE id = ?", [result.insertId]);
    res.status(201).json(mapDonation(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── POST (admin manual entry) — admin only ───────────────────────────────────
router.post("/admin", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { donor, amount, type, campaign, channel, status, notes } = req.body;

    if (!donor || !amount || !campaign) {
      return res.status(400).json({ message: "donor, amount, campaign are required" });
    }

    const date = new Date().toISOString().split("T")[0];

    const [result] = await pool.query(
      `INSERT INTO donations (donor, amount, type, campaign, channel, status, notes, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        donor,
        Number(amount),
        type || "One-time",
        campaign,
        channel || "Bank Transfer",
        status || "Completed",
        notes || "",
        date,
      ]
    );

    const [rows] = await pool.query("SELECT * FROM donations WHERE id = ?", [result.insertId]);
    res.status(201).json(mapDonation(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── PUT — admin only ─────────────────────────────────────────────────────────
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { donor, amount, type, campaign, channel, status, notes } = req.body;

    const [result] = await pool.query(
      `UPDATE donations
       SET donor=?, amount=?, type=?, campaign=?, channel=?, status=?, notes=?
       WHERE id=?`,
      [
        donor,
        Number(amount),
        type || "One-time",
        campaign,
        channel || "Bank Transfer",
        status || "Completed",
        notes || "",
        req.params.id,
      ]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: "Not found" });

    const [rows] = await pool.query("SELECT * FROM donations WHERE id = ?", [req.params.id]);
    res.json(mapDonation(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── DELETE — admin only ──────────────────────────────────────────────────────
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM donations WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;