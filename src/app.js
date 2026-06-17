require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { ensureSchema } = require('./db/schema');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error, req, res, next) => {
  const status = error.status || 500;
  res.status(status).json({
    message: error.message || 'Internal server error',
    details: error.details
  });
});

const PORT = process.env.PORT || 3000;

async function start() {
  await ensureSchema();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

if (require.main === module) {
  start().catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = app;
