import sequelize from "./database.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  House,
  User,
  Provider,
  Dashboard,
  Widget,
  GenericDevice,
  DashboardWidget,
  DashboardWidgetDevice,
} from "../models/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.resolve(__dirname, "../../migrations");

const WIDGETS_CATALOGUE = [
  {
    name: "Switch",
    libelle: "Interrupteur",
    component: "Switch",
    description: "Toggle on/off simple",
    icon: "toggle-right",
    category: "switch",
    config_schema: {},
  },
  {
    name: "SwitchToggle",
    libelle: "Interrupteur Toggle",
    component: "SwitchToggle",
    description: "Design minimaliste avec toggle horizontal",
    icon: "🎚️",
    category: "switch",
    config_schema: {},
  },
  {
    name: "ActionButton",
    libelle: "Bouton Action",
    component: "ActionButton",
    description: "Bouton pour une action spécifique (ON, OFF, Toggle)",
    icon: "⚡",
    category: "action",
    config_schema: {
      action: {
        type: "string",
        enum: ["on", "off", "toggle"],
        required: true,
        default: "off",
        label: "Action",
      },
      label: {
        type: "string",
        required: true,
        default: "Action",
        label: "Label du bouton",
      },
      color: {
        type: "string",
        enum: ["red", "green", "blue", "purple"],
        required: true,
        default: "red",
        label: "Couleur",
      },
    },
  },
  {
    name: "SwitchNeon",
    libelle: "Switch Néon",
    component: "SwitchNeon",
    description: "Switch futuriste avec effet néon et animations cyberpunk",
    icon: "⚡",
    category: "switch",
    config_schema: {},
  },
  {
    name: "Sensor",
    libelle: "Capteur Etat",
    component: "Sensor",
    description:
      "Affiche l'etat ON/OFF d'un ou plusieurs devices en quasi temps reel",
    icon: "📡",
    category: "sensor",
    config_schema: {},
  },
  {
    name: "StateMessage",
    libelle: "Message Etat 1/0",
    component: "StateMessage",
    description: "Affiche un message personnalise selon la valeur 1 ou 0",
    icon: "💬",
    category: "sensor",
    config_schema: {
      trueMessage: {
        type: "string",
        required: true,
        default: "Allume",
        label: "Message quand 1",
      },
      falseMessage: {
        type: "string",
        required: true,
        default: "Eteint",
        label: "Message quand 0",
      },
      trueColor: {
        type: "string",
        enum: ["green", "red", "blue", "purple"],
        required: true,
        default: "green",
        label: "Couleur quand 1",
      },
      falseColor: {
        type: "string",
        enum: ["green", "red", "blue", "purple"],
        required: true,
        default: "red",
        label: "Couleur quand 0",
      },
    },
  },
  {
    name: "RawState",
    libelle: "Etat Brut",
    component: "RawState",
    description: "Affiche la donnee brute retournee par le provider",
    icon: "🧾",
    category: "sensor",
    config_schema: {},
  },
  {
    name: "TextTicker",
    libelle: "Message Defilant",
    component: "TextTicker",
    description: "Affiche un message graphique avec defilement automatique",
    icon: "📢",
    category: "media",
    requiresDevice: false,
    config_schema: {
      message: {
        type: "string",
        required: true,
        default: "Bienvenue dans votre dashboard",
        label: "Message",
      },
      speed: {
        type: "number",
        required: true,
        default: 16,
        label: "Vitesse de defilement (s)",
      },
    },
  },
  {
    name: "Clock",
    libelle: "Horloge",
    component: "Clock",
    description: "Affiche l'heure en temps reel",
    icon: "🕒",
    category: "media",
    requiresDevice: false,
    config_schema: {},
  },
  {
    name: "Weather",
    libelle: "Meteo",
    component: "Weather",
    description: "Affiche la meteo en direct a partir d'une adresse",
    icon: "🌤️",
    category: "media",
    requiresDevice: false,
    config_schema: {
      address: {
        type: "string",
        required: true,
        default: "Paris",
        label: "Adresse / Ville",
      },
    },
  },
  {
    name: "Section",
    libelle: "Section",
    component: "Section",
    description:
      "Zone coloree transparente pour organiser visuellement le dashboard",
    icon: "🟦",
    category: "layout",
    requiresDevice: false,
    config_schema: {
      sectionColor: {
        type: "string",
        enum: ["white", "blue", "emerald", "violet", "rose", "amber", "cyan"],
        required: true,
        default: "white",
        label: "Couleur de la section",
      },
    },
  },
  {
    name: "PhotoFrame",
    libelle: "Cadre Photo",
    component: "PhotoFrame",
    description: "Affiche un diaporama de photos",
    icon: "🖼️",
    category: "media",
    requiresDevice: false,
    config_schema: {
      photos: {
        type: "array",
        required: false,
        default: [],
        label: "Photos",
      },
      intervalSeconds: {
        type: "number",
        required: true,
        default: 6,
        label: "Intervalle (secondes)",
      },
    },
  },
];

async function ensureMigrationsTable() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) PRIMARY KEY,
      run_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function runSqlMigrations() {
  await ensureMigrationsTable();

  const entries = await fs.readdir(MIGRATIONS_DIR);
  const sqlFiles = entries
    .filter((name) => name.toLowerCase().endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  for (const fileName of sqlFiles) {
    const [rows] = await sequelize.query(
      "SELECT name FROM schema_migrations WHERE name = :name LIMIT 1",
      {
        replacements: { name: fileName },
      },
    );

    if (Array.isArray(rows) && rows.length > 0) {
      console.log(`↷ SQL migration already applied: ${fileName}`);
      continue;
    }

    const fullPath = path.join(MIGRATIONS_DIR, fileName);
    const sql = await fs.readFile(fullPath, "utf8");
    if (!sql.trim()) {
      console.log(`↷ SQL migration empty, skipped: ${fileName}`);
      continue;
    }

    console.log(`→ Running SQL migration: ${fileName}`);
    await sequelize.transaction(async (t) => {
      await sequelize.query(sql, { transaction: t });
      await sequelize.query(
        "INSERT INTO schema_migrations (name) VALUES (:name)",
        {
          replacements: { name: fileName },
          transaction: t,
        },
      );
    });
    console.log(`✓ SQL migration applied: ${fileName}`);
  }
}

async function upsertWidgetsCatalogue() {
  for (const widget of WIDGETS_CATALOGUE) {
    const [instance, created] = await Widget.findOrCreate({
      where: { name: widget.name },
      defaults: widget,
    });

    if (!created) {
      await instance.update(widget);
    }
  }
}

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log("✓ Database connection established");

    // Sync models (create missing tables and columns)
    // alter: true will modify existing tables without dropping them
    // NEVER use force: true in production - it drops all data!
    await sequelize.sync({ alter: true });
    console.log("✓ Database schema synchronized");

    // Run ordered SQL migrations (idempotent) before catalogue sync
    await runSqlMigrations();
    console.log("✓ SQL migrations synchronized");

    // Ensure default widgets exist in all environments (CI/CD, prod, local)
    await upsertWidgetsCatalogue();
    console.log("✓ Widgets catalogue synchronized");

    process.exit(0);
  } catch (error) {
    console.error("✗ Migration failed:", error);
    console.error(error.stack);
    process.exit(1);
  }
}

migrate();
