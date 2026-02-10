import sequelize from './database.js';
import { User, Provider } from '../models/index.js';

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Vérifier si un user existe déjà
    let user = await User.findOne({ where: { email: 'admin@home.local' } });

    if (!user) {
      // Créer user admin
      user = await User.create({
        email: 'admin@home.local',
        password: 'demo123',
        name: 'Admin'
      });
      console.log('✓ Admin user created: admin@home.local / demo123');
    } else {
      console.log('✓ Admin user already exists');
    }

    // Vérifier si le provider Jeedom de test existe déjà
    const existingProvider = await Provider.findOne({
      where: {
        userId: user.id,
        type: 'jeedom'
      }
    });

    if (!existingProvider) {
      // Créer provider Jeedom de test
      await Provider.create({
        userId: user.id,
        type: 'jeedom',
        name: 'Jeedom Test',
        configEncrypted: {
          url: 'https://home.ti1.fr',
          apiKey: 'p5DsvDmHbpDDUkBUI4D7JOhbSTQ41Q4nQfkn6pNH4Rl52wYQCF3TTsJQ8RG0pmx2'
        }
      });
      console.log('✓ Test Jeedom provider created');
    } else {
      console.log('✓ Test Jeedom provider already exists');
    }

    console.log('\n✅ Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Seed failed:', error);
    process.exit(1);
  }
}

seed();
