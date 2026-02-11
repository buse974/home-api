import sequelize from './database.js';
import { House, User, Provider, Dashboard, Widget } from '../models/index.js';

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // 1. Créer la maison
    let house = await House.findOne({ where: { name: 'Ma Maison' } });

    if (!house) {
      house = await House.create({
        name: 'Ma Maison'
      });
      console.log('✓ House created: Ma Maison');
    } else {
      console.log('✓ House already exists');
    }

    // 2. Créer l'utilisateur admin
    let user = await User.findOne({ where: { email: 'admin@home.local' } });

    if (!user) {
      user = await User.create({
        houseId: house.id,
        email: 'admin@home.local',
        password: 'demo123',
        name: 'Admin',
        role: 'admin'
      });
      console.log('✓ Admin user created: admin@home.local / demo123');
    } else {
      console.log('✓ Admin user already exists');
    }

    // 3. Créer le provider Jeedom
    let provider = await Provider.findOne({
      where: {
        houseId: house.id,
        type: 'jeedom'
      }
    });

    if (!provider) {
      provider = await Provider.create({
        houseId: house.id,
        type: 'jeedom',
        name: 'Jeedom Principal',
        configEncrypted: {
          url: 'https://home.ti1.fr',
          apiKey: 'p5DsvDmHbpDDUkBUI4D7JOhbSTQ41Q4nQfkn6pNH4Rl52wYQCF3TTsJQ8RG0pmx2'
        }
      });
      console.log('✓ Jeedom provider created');
    } else {
      console.log('✓ Jeedom provider already exists');
    }

    // 4. Créer le dashboard par défaut
    let dashboard = await Dashboard.findOne({
      where: {
        houseId: house.id,
        name: 'Mon Dashboard'
      }
    });

    if (!dashboard) {
      dashboard = await Dashboard.create({
        houseId: house.id,
        name: 'Mon Dashboard',
        isDefault: true
      });
      console.log('✓ Dashboard created: Mon Dashboard');
    } else {
      console.log('✓ Dashboard already exists');
    }

    // 5. Créer le widget Switch (catalogue)
    let widget = await Widget.findOne({ where: { name: 'Switch' } });

    if (!widget) {
      widget = await Widget.create({
        name: 'Switch',
        libelle: 'Interrupteur',
        component: 'Switch',
        description: 'Toggle on/off simple',
        icon: 'toggle-right',
        config_schema: {}
      });
      console.log('✓ Widget Switch created');
    } else {
      console.log('✓ Widget Switch already exists');
    }

    console.log('\n✅ Seed completed successfully');
    console.log('\nℹ️  Login with: admin@home.local / demo123');
    process.exit(0);
  } catch (error) {
    console.error('✗ Seed failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

seed();
