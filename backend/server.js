const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./config/db');

const donorsRoutes = require('./routes/donors.routes');
const authRoutes = require('./routes/auth.routes');
const campaignsRoutes = require('./routes/campaigns.routes');
const eventsRoutes = require('./routes/events.routes');
const grantsRoutes = require('./routes/grants.routes');
const causeMarketingRoutes = require('./routes/causeMarketing.routes');
const donationsRoutes = require('./routes/donations.routes');
const communicationsRoutes = require('./routes/communications.routes');
const userRoutes = require('./routes/user.routes');
const publicRoutes = require('./routes/public.routes');
const messagesRoutes = require('./routes/messages.routes')

const app = express();

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || origin.endsWith('.vercel.app') || origin === 'http://localhost:5173') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/donors', donorsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/grants', grantsRoutes);
app.use('/api/cause-marketing', causeMarketingRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/communications', communicationsRoutes);
app.use('/api/users', userRoutes);
app.use('/public', publicRoutes);
app.use('/api/messages', messagesRoutes)

app.get('/', (req, res) => {
  res.send('Backend is running ✅');
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, async () => {
  try {
    await db.query('SELECT 1');
    console.log(`Backend running at http://localhost:${PORT}`);
    console.log('MySQL connected ✅');

    if (!process.env.JWT_SECRET) {
      console.warn('⚠️  JWT_SECRET is missing in .env (login will fail)');
    }
  } catch (err) {
    console.error('MySQL connection failed ❌', err);
  }
});