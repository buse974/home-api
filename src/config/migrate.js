import sequelize from './database.js';
import { User, Provider, Dashboard, DashboardItem } from '../models/index.js';

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
