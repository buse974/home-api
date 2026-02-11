import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DashboardWidgetDevice = sequelize.define('DashboardWidgetDevice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  dashboardWidgetId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'dashboard_widget_id',
    references: {
      model: 'dashboard_widgets',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  genericDeviceId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'generic_device_id',
    references: {
      model: 'generic_devices',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'dashboard_widget_devices',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['dashboard_widget_id', 'generic_device_id']
    }
  ]
});

export default DashboardWidgetDevice;
