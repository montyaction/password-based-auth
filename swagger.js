// swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0', // Specifies the OpenAPI version
        info: {
            title: 'User Management API', // Your API title
            version: '1.0.0',          // Your API version
            description: 'A simple CRUD API for managing users with authentication and authorization.',
        },
        servers: [
            {
                url: 'http://LAPTOP-7GH2D819:3000', // The URL of your server
            },
        ],
    },
    apis: ['./routes/*.js'], // Path to the API route files where you'll add JSDoc comments
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;