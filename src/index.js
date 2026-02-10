import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import sequelize from './config/database.js';
import './models/index.js'; // Charger les associations

// Routes
import authRoutes from './routes/auth.js';
import providerRoutes from './routes/providers.js';
import dashboardRoutes from './routes/dashboards.js';
import deviceRoutes from './routes/devices.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Swagger documentation
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Home API',
    version: '1.0.0',
    description: 'API multi-tenant pour piloter installations domotiques (Jeedom, MQTT, Home Assistant)'
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local' },
    { url: 'https://api.home.51.77.223.61.nip.io', description: 'Production' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        tags: ['System'],
        responses: {
          200: { description: 'OK' }
        }
      }
    },
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                  name: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'User created' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Login',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Login successful' }
        }
      }
    },
    '/providers': {
      get: {
        summary: 'Get all providers',
        tags: ['Providers'],
        responses: {
          200: { description: 'List of providers' }
        }
      },
      post: {
        summary: 'Add a new provider',
        tags: ['Providers'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['jeedom', 'mqtt', 'homeassistant'] },
                  name: { type: 'string' },
                  config: { type: 'object' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Provider created' }
        }
      }
    },
    '/dashboards': {
      get: {
        summary: 'Get all dashboards',
        tags: ['Dashboards'],
        responses: {
          200: { description: 'List of dashboards' }
        }
      },
      post: {
        summary: 'Create a dashboard',
        tags: ['Dashboards'],
        responses: {
          201: { description: 'Dashboard created' }
        }
      }
    },
    '/devices/{providerId}': {
      get: {
        summary: 'Get devices from a provider',
        tags: ['Devices'],
        parameters: [
          {
            name: 'providerId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: { description: 'List of devices' }
        }
      }
    }
  }
};

// Middleware
app.use(cors());
app.use(express.json());

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'home-api', type: 'api' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/providers', providerRoutes);
app.use('/dashboards', dashboardRoutes);
app.use('/devices', deviceRoutes);

// Start server
const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected');

    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Swagger docs: http://localhost:${PORT}/docs`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

start();
