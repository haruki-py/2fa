require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pool = require('./db');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  optionsSuccessStatus: 200
}));
app.use(express.json());

const authRoutes = require('./routes/auth');
const twofaRoutes = require('./routes/twofa');

app.use('/api/auth', authRoutes);
app.use('/api/2fa', twofaRoutes);

app.get('/', (req, res) => {
    res.send('2FA API is running');
});

const PORT = process.env.PORT || 3000;

pool.connect()
  .then(() => {
    app.listen(PORT, () => {});
  })
  .catch(err => {});
