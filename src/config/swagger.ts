import swaggerJSDoc from "swagger-jsdoc";
import { env } from "./env";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SmartCook Backend API Documentation",
      version: "1.0.0",
      description: "Tài liệu API chính thức cho hệ thống SmartCook Backend",
      contact: {
        name: "SmartCook Dev Team",
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v1`,
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: [
    "./src/routes/*.ts",
    "./dist/routes/*.js",
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
