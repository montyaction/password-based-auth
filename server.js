// server.js
const http = require("http");
const fs = require("fs");
const path = require("path");
const swaggerSpec = require("./swagger.js");
const { authRoutes } = require("./routes/authRoutes");
const { userRoutes } = require("./routes/userRoutes");
const { connectDB, closeDB } = require("./config/db");
const { setUserSchema } = require("./models/userSchema");

require("dotenv").config();

// Get the absolute path to the 'dist' directory of the 'swagger-ui-dist' package
const swaggerUiDistPath = require('swagger-ui-dist').getAbsoluteFSPath();

const hostname = process.env.HOST_NAME || "localhost";
const port = process.env.PORT || 3000;

// Security headers to add to all responses
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  // Updated CSP to allow Swagger UI to function properly
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'"
};

async function main() {
  try {
    await connectDB();
    await setUserSchema();

    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const pathname = url.pathname;

      console.log(`${req.method} ${pathname}`);

      // Add security headers to all responses
      Object.entries(securityHeaders).forEach(([header, value]) => {
        res.setHeader(header, value);
      });

      // Handle CORS
      res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // Serve the dynamically generated swagger.json
      if (pathname === '/swagger.json') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(swaggerSpec));
        return;
      }

      // Create a custom swagger-initializer.js file
      if (pathname === '/swagger-initializer.js') {
        const initializerContent = `
          window.onload = function() {
            window.ui = SwaggerUIBundle({
              url: "/swagger.json",
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
              ],
              plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
              ],
              layout: "StandaloneLayout"
            });
          };
        `;
        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        res.end(initializerContent, 'utf-8');
        return;
      }

      // Serve Swagger UI static files
      if (pathname === '/' || pathname === '/index.html') {
        // Redirect root to Swagger UI
        res.writeHead(301, { Location: '/api-docs' });
        res.end();
        return;
      } else if (pathname === '/api-docs' || pathname === '/api-docs/') {
        // Serve the Swagger UI HTML
        const indexPath = path.join(swaggerUiDistPath, 'index.html');
        fs.readFile(indexPath, (error, content) => {
          if (error) {
            res.writeHead(500);
            res.end('Server Error: ' + error.code);
            return;
          }

          // Modify index.html to point to our local swagger.json and use our custom initializer
          const updatedContent = content.toString()
            .replace('https://petstore.swagger.io/v2/swagger.json', '/swagger.json')
            .replace(
              '<script src="./swagger-initializer.js" charset="UTF-8"> </script>',
              '<script src="/swagger-initializer.js" charset="UTF-8"> </script>'
            );
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(updatedContent, 'utf-8');
        });
        return;
      } else if (pathname.startsWith('/api-docs/')) {
        // Extract the file path from the URL
        const requestPath = pathname.substring('/api-docs/'.length);

        // Security check for path traversal attacks
        const resolvedPath = path.join(swaggerUiDistPath, requestPath);
        if (!resolvedPath.startsWith(swaggerUiDistPath)) {
          res.writeHead(403); // Forbidden
          res.end('403 Forbidden');
          return;
        }

        const extname = String(path.extname(resolvedPath)).toLowerCase();
        const mimeTypes = {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpg',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
        };
        const contentType = mimeTypes[extname] || 'application/octet-stream';

        fs.readFile(resolvedPath, (error, content) => {
          if (error) {
            if (error.code === 'ENOENT') {
              res.writeHead(404);
              res.end('404 Not Found');
            } else {
              res.writeHead(500);
              res.end('Server Error: ' + error.code);
            }
          } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
          }
        });
        return;
      }

      // Handle direct requests for Swagger UI assets from root path
      const swaggerAssets = [
        '/swagger-ui.css',
        '/swagger-ui-bundle.js',
        '/swagger-ui-standalone-preset.js',
        '/index.css'
      ];

      if (swaggerAssets.includes(pathname)) {
        // Get the asset name without the leading slash
        const assetName = pathname.substring(1);
        const assetPath = path.join(swaggerUiDistPath, assetName);

        const extname = String(path.extname(assetPath)).toLowerCase();
        const mimeTypes = {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpg',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
        };
        const contentType = mimeTypes[extname] || 'application/octet-stream';

        fs.readFile(assetPath, (error, content) => {
          if (error) {
            if (error.code === 'ENOENT') {
              res.writeHead(404);
              res.end('404 Not Found');
            } else {
              res.writeHead(500);
              res.end('Server Error: ' + error.code);
            }
          } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
          }
        });
        return;
      }

      // Parse request body for other routes
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          if (req.headers["content-type"] === "application/json") {
            try {
              req.body = JSON.parse(body);
            } catch (error) {
              console.error("JSON parsing error:", error);
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: false, message: "Invalid JSON" }));
              return;
            }
          } else {
            req.body = body; // For form data or other types
          }

          // Route requests
          if (pathname.startsWith("/user")) {
            userRoutes(req, res);
          } else {
            authRoutes(req, res);
          }
        } catch (error) {
          console.error("Request handling error:", error);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            success: false,
            message: "Internal server error"
          }));
        }
      });
    });

    server.listen(port, hostname, () => {
      console.log(`Server running at http://${hostname}:${port}/`);
      console.log(`Swagger UI available at http://${hostname}:${port}/api-docs`);
    });

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down gracefully...');
      await closeDB();
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
