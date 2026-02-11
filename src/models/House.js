import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const House = sequelize.define('House', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'houses',
  underscored: true,
  timestamps: true
});

export default House;
