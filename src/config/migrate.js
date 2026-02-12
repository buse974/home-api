import sequelize from "./database.js";
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
];

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
