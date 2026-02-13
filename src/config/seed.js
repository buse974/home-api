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
        requiresDevice: true,
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
        requiresDevice: true,
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
        requiresDevice: true,
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
        requiresDevice: true,
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
        requiresDevice: true,
        config_schema: {},
      });
      console.log("✓ Widget Sensor created");
    } else {
      console.log("✓ Widget Sensor already exists");
    }

    // 10. Créer le widget StateMessage (catalogue)
    let widgetStateMessage = await Widget.findOne({
      where: { name: "StateMessage" },
    });
    if (!widgetStateMessage) {
      widgetStateMessage = await Widget.create({
        name: "StateMessage",
        libelle: "Message Etat 1/0",
        component: "StateMessage",
        description: "Affiche un message personnalise selon la valeur 1 ou 0",
        icon: "💬",
        category: "sensor",
        requiresDevice: true,
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
      });
      console.log("✓ Widget StateMessage created");
    } else {
      console.log("✓ Widget StateMessage already exists");
    }

    // 11. Créer le widget RawState (catalogue)
    let widgetRawState = await Widget.findOne({ where: { name: "RawState" } });
    if (!widgetRawState) {
      widgetRawState = await Widget.create({
        name: "RawState",
        libelle: "Etat Brut",
        component: "RawState",
        description: "Affiche la donnee brute retournee par le provider",
        icon: "🧾",
        category: "sensor",
        requiresDevice: true,
        config_schema: {},
      });
      console.log("✓ Widget RawState created");
    } else {
      console.log("✓ Widget RawState already exists");
    }

    // 12. Créer le widget TextTicker (catalogue)
    let widgetTextTicker = await Widget.findOne({
      where: { name: "TextTicker" },
    });
    if (!widgetTextTicker) {
      widgetTextTicker = await Widget.create({
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
      });
      console.log("✓ Widget TextTicker created");
    } else {
      console.log("✓ Widget TextTicker already exists");
      if (widgetTextTicker.requiresDevice !== false) {
        await widgetTextTicker.update({ requiresDevice: false });
        console.log("✓ Widget TextTicker requiresDevice updated to false");
      }
    }

    // 13. Créer le widget Clock (catalogue)
    let widgetClock = await Widget.findOne({ where: { name: "Clock" } });
    if (!widgetClock) {
      widgetClock = await Widget.create({
        name: "Clock",
        libelle: "Horloge",
        component: "Clock",
        description: "Affiche l'heure en temps reel",
        icon: "🕒",
        category: "media",
        requiresDevice: false,
        config_schema: {},
      });
      console.log("✓ Widget Clock created");
    } else {
      console.log("✓ Widget Clock already exists");
      if (widgetClock.requiresDevice !== false) {
        await widgetClock.update({ requiresDevice: false });
        console.log("✓ Widget Clock requiresDevice updated to false");
      }
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
