import sequelize from "./database.js";
import { House, User, Provider, Dashboard, Widget } from "../models/index.js";

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("✓ Database connection established");

    // 1. Créer la maison
    let house = await House.findOne({ where: { name: "Ma Maison" } });

    if (!house) {
      house = await House.create({
        name: "Ma Maison",
      });
      console.log("✓ House created: Ma Maison");
    } else {
      console.log("✓ House already exists");
    }

    // 2. Créer l'utilisateur admin
    let user = await User.findOne({ where: { email: "admin@home.local" } });

    if (!user) {
      user = await User.create({
        houseId: house.id,
        email: "admin@home.local",
        password: "demo123",
        name: "Admin",
        role: "admin",
      });
      console.log("✓ Admin user created: admin@home.local / demo123");
    } else {
      console.log("✓ Admin user already exists");
    }

    // 3. Créer le provider Jeedom
    let provider = await Provider.findOne({
      where: {
        houseId: house.id,
        type: "jeedom",
      },
    });

    if (!provider) {
      provider = await Provider.create({
        houseId: house.id,
        type: "jeedom",
        name: "Jeedom Principal",
        configEncrypted: {
          url: "https://home.ti1.fr",
          apiKey:
            "p5DsvDmHbpDDUkBUI4D7JOhbSTQ41Q4nQfkn6pNH4Rl52wYQCF3TTsJQ8RG0pmx2",
        },
      });
      console.log("✓ Jeedom provider created");
    } else {
      console.log("✓ Jeedom provider already exists");
    }

    // 4. Créer le dashboard par défaut
    let dashboard = await Dashboard.findOne({
      where: {
        houseId: house.id,
        name: "Mon Dashboard",
      },
    });

    if (!dashboard) {
      dashboard = await Dashboard.create({
        houseId: house.id,
        name: "Mon Dashboard",
        isDefault: true,
      });
      console.log("✓ Dashboard created: Mon Dashboard");
    } else {
      console.log("✓ Dashboard already exists");
    }

    // 5. Créer le widget Switch (catalogue)
    let widget = await Widget.findOne({ where: { name: "Switch" } });

    if (!widget) {
      widget = await Widget.create({
        name: "Switch",
        libelle: "Interrupteur",
        component: "Switch",
        description: "Toggle on/off simple",
        icon: "toggle-right",
        category: "switch",
        config_schema: {},
      });
      console.log("✓ Widget Switch created");
    } else {
      console.log("✓ Widget Switch already exists");
    }

    // 6. Créer le widget SwitchToggle (catalogue)
    let widgetToggle = await Widget.findOne({
      where: { name: "SwitchToggle" },
    });

    if (!widgetToggle) {
      widgetToggle = await Widget.create({
        name: "SwitchToggle",
        libelle: "Interrupteur Toggle",
        component: "SwitchToggle",
        description: "Design minimaliste avec toggle horizontal",
        icon: "🎚️",
        category: "switch",
        config_schema: {},
      });
      console.log("✓ Widget SwitchToggle created");
    } else {
      console.log("✓ Widget SwitchToggle already exists");
    }

    // 7. Créer le widget ActionButton (catalogue)
    let widgetAction = await Widget.findOne({
      where: { name: "ActionButton" },
    });
    if (!widgetAction) {
      widgetAction = await Widget.create({
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
      });
      console.log("✓ Widget ActionButton created");
    } else {
      console.log("✓ Widget ActionButton already exists");
    }

    // 8. Créer le widget SwitchNeon (catalogue)
    let widgetNeon = await Widget.findOne({ where: { name: "SwitchNeon" } });
    if (!widgetNeon) {
      widgetNeon = await Widget.create({
        name: "SwitchNeon",
        libelle: "Switch Néon",
        component: "SwitchNeon",
        description: "Switch futuriste avec effet néon et animations cyberpunk",
        icon: "⚡",
        category: "switch",
        config_schema: {},
      });
      console.log("✓ Widget SwitchNeon created");
    } else {
      console.log("✓ Widget SwitchNeon already exists");
    }

    // 9. Créer le widget Sensor (catalogue)
    let widgetSensor = await Widget.findOne({ where: { name: "Sensor" } });
    if (!widgetSensor) {
      widgetSensor = await Widget.create({
        name: "Sensor",
        libelle: "Capteur Etat",
        component: "Sensor",
        description:
          "Affiche l'etat ON/OFF d'un ou plusieurs devices en quasi temps reel",
        icon: "📡",
        category: "sensor",
        config_schema: {},
      });
      console.log("✓ Widget Sensor created");
    } else {
      console.log("✓ Widget Sensor already exists");
    }

    console.log("\n✅ Seed completed successfully");
    console.log("\nℹ️  Login with: admin@home.local / demo123");
    process.exit(0);
  } catch (error) {
    console.error("✗ Seed failed:", error);
    console.error(error.stack);
    process.exit(1);
  }
}

seed();
