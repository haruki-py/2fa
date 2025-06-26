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
    res.send('2FA API is running and healthy.');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running and listening on port ${PORT}`);
  
  pool.connect(err => {
    if (err) {
      console.error('FATAL: Database connection failed.', err.stack);
    } else {
      console.log('Database connection has been established successfully.');
    }
  });
});
