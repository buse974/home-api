import User from './User.js';
import Provider from './Provider.js';
import Dashboard from './Dashboard.js';
import DashboardItem from './DashboardItem.js';

// Définir les associations entre modèles

// User <-> Provider
User.hasMany(Provider, { foreignKey: 'userId', as: 'providers' });
Provider.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Dashboard
User.hasMany(Dashboard, { foreignKey: 'userId', as: 'dashboards' });
Dashboard.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Dashboard <-> DashboardItem
Dashboard.hasMany(DashboardItem, { foreignKey: 'dashboardId', as: 'items' });
DashboardItem.belongsTo(Dashboard, { foreignKey: 'dashboardId', as: 'dashboard' });

// Provider <-> DashboardItem
Provider.hasMany(DashboardItem, { foreignKey: 'providerId', as: 'items' });
DashboardItem.belongsTo(Provider, { foreignKey: 'providerId', as: 'provider' });

export { User, Provider, Dashboard, DashboardItem };
