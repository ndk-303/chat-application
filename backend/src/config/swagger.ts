import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User API',
      version: '1.0.0',
      description: 'API Documentation for User Management',
    },
    servers: [
      {
        url: 'http://localhost:5051',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
            },
            name: {
              type: 'string',
              description: 'User name',
            },
            email: {
              type: 'string',
              description: 'User email',
            },
            password: {
              type: 'string',
              description: 'User password (hashed)',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Created date',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Updated date',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
