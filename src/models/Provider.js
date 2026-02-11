import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-char-encryption-key-here';
const KEY = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const Provider = sequelize.define('Provider', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  houseId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'house_id',
    references: {
      model: 'houses',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  type: {
    type: DataTypes.ENUM('jeedom', 'mqtt', 'homeassistant', 'zigbee2mqtt'),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  configEncrypted: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'config_encrypted',
    get() {
      const encrypted = this.getDataValue('configEncrypted');
      if (!encrypted) return null;
      const decrypted = decrypt(encrypted);
      return JSON.parse(decrypted);
    },
    set(value) {
      const encrypted = encrypt(JSON.stringify(value));
      this.setDataValue('configEncrypted', encrypted);
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  lastSyncAt: {
    type: DataTypes.DATE,
    field: 'last_sync_at'
  }
}, {
  tableName: 'providers',
  timestamps: true
});

export default Provider;
