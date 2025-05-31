import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// ✅ FORZA DEVELOPMENT MODE - IGNORA DIST
console.log('🔧 === FORCING DEVELOPMENT MODE ===');
process.env.NODE_ENV = 'development';
console.log('🌍 NODE_ENV:', process.env.NODE_ENV);

const app = express();

// ✅ FORZA ANCHE EXPRESS IN DEVELOPMENT
app.set("env", "development");
console.log('🎯 Express env:', app.get("env"));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ DEBUG: Log di tutte le richieste
app.use((req, res, next) => {
  console.log(`🔍 INCOMING: ${req.method} ${req.path}`);
  next();
});

// ✅ API TEST IMMEDIATA
app.get('/api/test-immediate', (req, res) => {
  console.log('✅ API TEST ROUTE HIT!');
  res.json({ 
    message: 'API funziona!', 
    env: process.env.NODE_ENV,
    expressEnv: app.get("env"),
    timestamp: new Date().toISOString() 
  });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  console.log('📝 Registering API routes...');
  const server = await registerRoutes(app);
  console.log('✅ API routes registered');

  // ✅ Error handler per API
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.log(`❌ Error handler hit for: ${req.path}`);
    if (req.path.startsWith('/api')) {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.log(`❌ API Error: ${status} - ${message}`);
      res.status(status).json({ message });
      return;
    }
    next(err);
  });

  // ✅ SEMPRE FORZA VITE DEVELOPMENT (ignora dist)
  console.log('🎨 FORCING Vite development setup (ignoring dist folder)...');
  await setupVite(app, server);
  console.log('✅ Vite setup complete');

  const port = 5000;
  // ✅ FIX PER WINDOWS - Usa il metodo semplice
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Frontend: http://localhost:${port}`);
    console.log(`🔌 API Test: http://localhost:${port}/api/test-immediate`);
    console.log('🎯 DEVELOPMENT MODE FORCED - DIST FOLDER IGNORED');
  });
})();