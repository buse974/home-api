import sequelize from './database.js';
import { House, User, Provider, Dashboard, Widget, GenericDevice, DashboardWidget, DashboardWidgetDevice } from '../models/index.js';

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Sync models (create tables)
    // Force: true will drop existing tables and recreate them
    await sequelize.sync({ force: true });
    console.log('✓ Database tables created');

    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

migrate();
