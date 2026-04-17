const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

const toDateOnly = (val) => {
  if (!val) return null;
  return String(val).slice(0, 10);
};

const toUnitsString = (val) => {
  if (val === null || val === undefined || String(val).trim() === '') return null;
  return String(val).trim();
};

const toAttachmentsJSON = (val) => {
  if (!val || !Array.isArray(val)) return JSON.stringify([]);
  return JSON.stringify(val);
};

const parseAttachments = (val) => {
  if (!val) return [];
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// ── GET all donors ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, c.title AS campaign_title
      FROM donors d
      LEFT JOIN campaigns c ON c.id = d.campaign_id
    `);
    const parsed = rows.map((row) => ({
      ...row,
      attachments: parseAttachments(row.attachments),
    }));
    res.json(parsed);
  } catch (err) {
    console.error('GET /donors error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST create donor ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      project, description, units, deliveryDate, dueDate,
      sponsor, amount, type, status, email, contact,
      contactPerson, tranches, campaign_id, attachments,
    } = req.body;

    if (!sponsor || !type || !status) {
      return res.status(400).json({
        message: 'Missing required fields.',
        received: { sponsor, type, status },
      });
    }

    const createdBy = req.user?.email || null;

    const sql = `
      INSERT INTO donors
        (project, description, units, deliveryDate, dueDate, sponsor, amount, type, status, email, contact, contactPerson, tranches, campaign_id, attachments, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      project      || null,
      description  || null,
      toUnitsString(units),
      toDateOnly(deliveryDate),
      toDateOnly(dueDate),
      sponsor,
      Number(amount   || 0),
      type,
      status,
      email        || null,
      contact      || null,
      contactPerson || null,
      Number(tranches || 0),
      campaign_id ? Number(campaign_id) : null,
      toAttachmentsJSON(attachments),
      createdBy,
    ];

    const [result] = await db.query(sql, values);

    return res.status(201).json({
      id:           result.insertId,
      project:      project      || null,
      description:  description  || null,
      units:        toUnitsString(units),
      deliveryDate: toDateOnly(deliveryDate),
      dueDate:      toDateOnly(dueDate),
      sponsor,
      amount:       Number(amount || 0),
      type,
      status,
      email:        email        || null,
      contact:      contact      || null,
      contactPerson: contactPerson || null,
      tranches:     Number(tranches || 0),
      campaign_id:  campaign_id ? Number(campaign_id) : null,
      attachments:  Array.isArray(attachments) ? attachments : [],
      created_by:   createdBy,
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
      project, description, units, deliveryDate, dueDate,
      sponsor, amount, type, status, email, contact,
      contactPerson, tranches, campaign_id, attachments,
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
        contactPerson = ?,
        tranches     = ?,
        campaign_id  = ?,
        attachments  = ?,
        created_by   = COALESCE(created_by, ?)
      WHERE id = ?
    `;

    const values = [
      project      || null,
      description  || null,
      toUnitsString(units),
      toDateOnly(deliveryDate),
      toDateOnly(dueDate),
      sponsor,
      Number(amount   || 0),
      type,
      status,
      email        || null,
      contact      || null,
      contactPerson || null,
      Number(tranches || 0),
      campaign_id ? Number(campaign_id) : null,
      toAttachmentsJSON(attachments),
      req.user?.email || null,
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
      toUnitsString(snapshot.units),
      toDateOnly(snapshot.deliveryDate),
      toDateOnly(snapshot.dueDate),
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
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;