import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Dashboard = sequelize.define(
  "Dashboard",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    houseId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "house_id",
      references: {
        model: "houses",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    configJson: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: "config_json",
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_default",
    },
    layouts: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: "dashboards",
    timestamps: true,
  },
);

export default Dashboard;
