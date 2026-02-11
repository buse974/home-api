import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const GenericDevice = sequelize.define('GenericDevice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  provider_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'providers',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  capabilities: {
    type: DataTypes.JSON,
    allowNull: false
  },
  command_mapping: {
    type: DataTypes.JSON,
    allowNull: false
  }
}, {
  tableName: 'generic_devices',
  underscored: true,
  timestamps: true
});

export default GenericDevice;
