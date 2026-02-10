import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'sqlite',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  storage: './home.db'
});

export default sequelize;
