import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DashboardWidget = sequelize.define('DashboardWidget', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  dashboardId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'dashboard_id',
    references: {
      model: 'dashboards',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  widgetId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'widget_id',
    references: {
      model: 'widgets',
      key: 'id'
    },
    onDelete: 'RESTRICT'
  },
  config: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  position: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: { x: 0, y: 0, w: 2, h: 1 }
  }
}, {
  tableName: 'dashboard_widgets',
  underscored: true,
  timestamps: true
});

export default DashboardWidget;
