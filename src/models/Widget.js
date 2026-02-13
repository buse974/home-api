import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Widget = sequelize.define(
  "Widget",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    libelle: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    component: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    icon: {
      type: DataTypes.STRING,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    requiresDevice: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    config_schema: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    tableName: "widgets",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

export default Widget;
