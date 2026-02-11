import House from './House.js';
import User from './User.js';
import Provider from './Provider.js';
import Dashboard from './Dashboard.js';
import Widget from './Widget.js';
import GenericDevice from './GenericDevice.js';
import DashboardWidget from './DashboardWidget.js';
import DashboardWidgetDevice from './DashboardWidgetDevice.js';

// Définir les associations entre modèles

// House <-> User
House.hasMany(User, { foreignKey: 'houseId', as: 'users' });
User.belongsTo(House, { foreignKey: 'houseId', as: 'house' });

// House <-> Provider
House.hasMany(Provider, { foreignKey: 'houseId', as: 'providers' });
Provider.belongsTo(House, { foreignKey: 'houseId', as: 'house' });

// House <-> Dashboard
House.hasMany(Dashboard, { foreignKey: 'houseId', as: 'dashboards' });
Dashboard.belongsTo(House, { foreignKey: 'houseId', as: 'house' });

// Provider <-> GenericDevice
Provider.hasMany(GenericDevice, { foreignKey: 'provider_id', as: 'devices' });
GenericDevice.belongsTo(Provider, { foreignKey: 'provider_id', as: 'Provider' });

// Dashboard <-> DashboardWidget
Dashboard.hasMany(DashboardWidget, { foreignKey: 'dashboardId', as: 'DashboardWidgets' });
DashboardWidget.belongsTo(Dashboard, { foreignKey: 'dashboardId', as: 'Dashboard' });

// Widget <-> DashboardWidget
Widget.hasMany(DashboardWidget, { foreignKey: 'widgetId', as: 'dashboardWidgets' });
DashboardWidget.belongsTo(Widget, { foreignKey: 'widgetId', as: 'Widget' });

// GenericDevice <-> DashboardWidget (many-to-many via DashboardWidgetDevice)
DashboardWidget.belongsToMany(GenericDevice, {
  through: DashboardWidgetDevice,
  foreignKey: 'dashboardWidgetId',
  otherKey: 'genericDeviceId',
  as: 'GenericDevices'
});
GenericDevice.belongsToMany(DashboardWidget, {
  through: DashboardWidgetDevice,
  foreignKey: 'genericDeviceId',
  otherKey: 'dashboardWidgetId',
  as: 'DashboardWidgets'
});

export {
  House,
  User,
  Provider,
  Dashboard,
  Widget,
  GenericDevice,
  DashboardWidget,
  DashboardWidgetDevice
};
