const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const pool = require("../config/db");
const { requireAuth } = require("../middleware/auth");


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
               allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error("Images only"));
  },
});


const mapEvent = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  date: row.date,
  time: row.time,
  goal: Number(row.goal || 0),
  status: row.status,
  image: row.image ? `/uploads/${row.image}` : null,
});


router.get("/", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM events ORDER BY date DESC");
    res.json(rows.map(mapEvent));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/", requireAuth, upload.single("image"), async (req, res) => {
  try {
    const { title, description, date, time, goal, status } = req.body;
    if (!title || !date) return res.status(400).json({ message: "title and date are required" });

    const imageFilename = req.file ? req.file.filename : null;

    const [result] = await pool.query(
      `INSERT INTO events (title, description, date, time, goal, status, image)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description || null, date, time || null, Number(goal || 0), status || "Upcoming", imageFilename]
    );

    const [rows] = await pool.query("SELECT * FROM events WHERE id=?", [result.insertId]);
    res.status(201).json(mapEvent(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});


router.put("/:id", requireAuth, upload.single("image"), async (req, res) => {
  try {
    const { title, description, date, time, goal, status } = req.body;


    let imageFilename = undefined;
    if (req.file) {
      imageFilename = req.file.filename;
    } else {
      const [existing] = await pool.query("SELECT image FROM events WHERE id=?", [req.params.id]);
      imageFilename = existing[0]?.image || null;
    }

    const [result] = await pool.query(
      `UPDATE events SET title=?, description=?, date=?, time=?, goal=?, status=?, image=? WHERE id=?`,
      [title, description || null, date, time || null, Number(goal || 0), status, imageFilename, req.params.id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: "Not found" });

    const [rows] = await pool.query("SELECT * FROM events WHERE id=?", [req.params.id]);
    res.json(mapEvent(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});


router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM events WHERE id=?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;