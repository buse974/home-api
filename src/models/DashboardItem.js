import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DashboardItem = sequelize.define('DashboardItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  dashboardId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'dashboard_id'
  },
  providerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'provider_id'
  },
  providerDeviceId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'provider_device_id'
  },
  type: {
    type: DataTypes.ENUM('switch', 'slider', 'sensor', 'thermostat', 'gauge', 'chart'),
    allowNull: false
  },
  configJson: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'config_json'
  }
}, {
  tableName: 'dashboard_items',
  timestamps: true
});

export default DashboardItem;
