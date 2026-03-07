const express = require('express')
const router = express.Router()
const pool = require('../config/db')
const { requireAuth, requireAdmin } = require('../middleware/auth')
const jwt = require('jsonwebtoken')

// Optional auth middleware — attaches user if token present, but doesn't block if not
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET)
    } catch {
      req.user = null
    }
  }
  next()
}

// POST /api/messages — works for both guests and logged-in users
router.post('/', optionalAuth, async (req, res) => {
  const { subject, message } = req.body

  // If logged in, pull name/email from token; otherwise require them in body
  const user_id = req.user?.userId || null
  const name = req.user?.name || req.body.name
  const email = req.user?.email || req.body.email

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email, and message are required.' })
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO messages (user_id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)',
      [user_id, name, email, subject || '', message]
    )
    res.status(201).json({ id: result.insertId, name, email, subject, message, status: 'Unread' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/messages/mine — logged-in user sees their own messages + replies
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const [messages] = await pool.query(
      'SELECT * FROM messages WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.userId]  // ✅ FIXED
    )
    const messagesWithReplies = await Promise.all(
      messages.map(async (msg) => {
        const [replies] = await pool.query(
          'SELECT * FROM message_replies WHERE message_id = ? ORDER BY sent_at ASC',
          [msg.id]
        )
        return { ...msg, replies }
      })
    )
    res.json(messagesWithReplies)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/messages — admin sees all messages
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM messages ORDER BY created_at DESC')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// PATCH /api/messages/:id/read — mark as read, admin only
router.patch('/:id/read', requireAuth, requireAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE messages SET status = ? WHERE id = ?', ['Read', req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/messages/:id/reply — admin saves a reply to DB
router.post('/:id/reply', requireAuth, requireAdmin, async (req, res) => {
  const { replyBody } = req.body
  if (!replyBody) return res.status(400).json({ message: 'Reply body is required.' })

  try {
    const [[original]] = await pool.query('SELECT * FROM messages WHERE id = ?', [req.params.id])
    if (!original) return res.status(404).json({ message: 'Message not found.' })

    await pool.query(
      'INSERT INTO message_replies (message_id, reply_body, sent_at) VALUES (?, ?, NOW())',
      [req.params.id, replyBody]
    )
    await pool.query('UPDATE messages SET status = ? WHERE id = ?', ['Read', req.params.id])

    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/messages/:id/replies — get replies for a message, admin only
router.get('/:id/replies', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM message_replies WHERE message_id = ? ORDER BY sent_at ASC',
      [req.params.id]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// DELETE /api/messages/:id — admin only
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM messages WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})
// POST /api/messages/:id/user-reply — logged-in user replies to a thread
router.post('/:id/user-reply', requireAuth, async (req, res) => {
  const { replyBody } = req.body
  if (!replyBody) return res.status(400).json({ message: 'Reply body is required.' })
  try {
    await pool.query(
      'INSERT INTO message_replies (message_id, reply_body, sent_at, sender) VALUES (?, ?, NOW(), ?)',
      [req.params.id, replyBody, 'user']
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router