import sequelize from './database.js';
import { House, User, Provider, Dashboard, Widget, GenericDevice, DashboardWidget, DashboardWidgetDevice } from '../models/index.js';

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Sync models (create missing tables and columns)
    // alter: true will modify existing tables without dropping them
    // NEVER use force: true in production - it drops all data!
    await sequelize.sync({ alter: true });
    console.log('✓ Database schema synchronized');

    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

migrate();
