require('dotenv').config();
const app = require('./src/config/app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(` Docs   http://localhost:${PORT}/api-docs`);
});

server.on('error', (err) => {
  console.error('Server error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});