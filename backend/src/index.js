require('dotenv').config();
const { sequelize } = require('./models');
const seedDatabase = require('./utils/seeder');
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Local development: sync DB and start server
async function startServer() {
  try {
    await sequelize.sync({ alter: true });
    console.log('📚 Database synced successfully.');

    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API ready at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
