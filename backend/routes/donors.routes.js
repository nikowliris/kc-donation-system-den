const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ── GET all donors — join campaign title ──────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, c.title AS campaign_title
      FROM donors d
      LEFT JOIN campaigns c ON c.id = d.campaign_id
      ORDER BY d.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('GET /donors error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST create donor ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/donors body:', req.body);

    const {
      project,
      description,
      units,
      deliveryDate,
      dueDate,
      sponsor,
      amount,
      type,
      status,
      email,
      contact,
      tranches,
      campaign_id,
    } = req.body;

    if (!sponsor || !type || !status) {
      return res.status(400).json({
        message: 'Missing required fields.',
        received: { sponsor, type, status },
      });
    }

    const sql = `
      INSERT INTO donors
        (project, description, units, deliveryDate, dueDate, sponsor, amount, type, status, email, contact, tranches, campaign_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      project       || null,
      description   || null,
      Number(units  || 0),
      deliveryDate  || null,
      dueDate       || null,
      sponsor,
      Number(amount || 0),
      type,
      status,
      email         || null,
      contact       || null,
      Number(tranches || 0),
      campaign_id ? Number(campaign_id) : null,
    ];

    const [result] = await db.query(sql, values);

    return res.status(201).json({
      id:           result.insertId,
      project:      project      || null,
      description:  description  || null,
      units:        Number(units || 0),
      deliveryDate: deliveryDate || null,
      dueDate:      dueDate      || null,
      sponsor,
      amount:       Number(amount || 0),
      type,
      status,
      email:        email        || null,
      contact:      contact      || null,
      tranches:     Number(tranches || 0),
      campaign_id:  campaign_id ? Number(campaign_id) : null,
    });
  } catch (err) {
    console.error('POST /api/donors error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── PUT update donor ──────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      project,
      description,
      units,
      deliveryDate,
      dueDate,
      sponsor,
      amount,
      type,
      status,
      email,
      contact,
      tranches,
      campaign_id,
    } = req.body;

    const sql = `
      UPDATE donors
      SET
        project      = ?,
        description  = ?,
        units        = ?,
        deliveryDate = ?,
        dueDate      = ?,
        sponsor      = ?,
        amount       = ?,
        type         = ?,
        status       = ?,
        email        = ?,
        contact      = ?,
        tranches     = ?,
        campaign_id  = ?
      WHERE id = ?
    `;

    const values = [
      project       || null,
      description   || null,
      Number(units  || 0),
      deliveryDate  || null,
      dueDate       || null,
      sponsor,
      Number(amount || 0),
      type,
      status,
      email         || null,
      contact       || null,
      Number(tranches || 0),
      campaign_id ? Number(campaign_id) : null,
      id,
    ];

    const [result] = await db.query(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    res.json({ message: 'Updated successfully' });
  } catch (err) {
    console.error('PUT /donors/:id error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── DELETE donor ──────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM donors WHERE id = ?', [id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('DELETE /donors/:id error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET history for a donor ───────────────────────────────────────────────────
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      'SELECT * FROM donor_history WHERE donor_id = ? ORDER BY saved_at DESC',
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /donors/:id/history error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST save a history snapshot ──────────────────────────────────────────────
router.post('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const snapshot = req.body;

    const sql = `
      INSERT INTO donor_history
        (donor_id, project, description, units, deliveryDate, dueDate, sponsor, amount, type, status, email, contact, tranches, saved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      id,
      snapshot.project      || null,
      snapshot.description  || null,
      Number(snapshot.units || 0),
      snapshot.deliveryDate || null,
      snapshot.dueDate      || null,
      snapshot.sponsor      || null,
      Number(snapshot.amount || 0),
      snapshot.type         || null,
      snapshot.status       || null,
      snapshot.email        || null,
      snapshot.contact      || null,
      Number(snapshot.tranches || 0),
    ];

    const [result] = await db.query(sql, values);
    res.status(201).json({ id: result.insertId, message: 'Snapshot saved' });
  } catch (err) {
    console.error('POST /donors/:id/history error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;