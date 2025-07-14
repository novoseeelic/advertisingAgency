require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Routes
app.use('/api/advertisers', require('./routes/advertisers'));
app.use('/api/agents', require('./routes/agents'));
app.use('/api/contracts', require('./routes/contracts'));
app.use('/api/ads', require('./routes/ads'));
app.use('/api/analytics', require('./routes/analytics'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});