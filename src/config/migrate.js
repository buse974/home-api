import sequelize from './database.js';
import User from '../models/User.js';
import Provider from '../models/Provider.js';
import Dashboard from '../models/Dashboard.js';
import DashboardItem from '../models/DashboardItem.js';

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Sync models (create tables)
    await sequelize.sync({ alter: true });
    console.log('✓ Database tables synced');

    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
