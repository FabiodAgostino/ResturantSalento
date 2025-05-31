import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true as const,
    hmr: { server },
    host: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // Aggiungi il middleware di Vite
  app.use(vite.middlewares);
  
  // ✅ CATCH-ALL con protezione per le API routes
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // ✅ CRUCIALE: Escludi tutte le API routes
    if (url.startsWith('/api')) {
      log(`API route detected: ${url} - skipping Vite`, "vite");
      return next();
    }

    // ✅ Escludi anche altri paths statici se necessario
    if (url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
      log(`Static asset detected: ${url} - skipping Vite`, "vite");
      return next();
    }

    try {
      log(`Serving React app for: ${url}`, "vite");
      
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // Sempre ricarica il file index.html dal disco nel caso cambi
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      
      // Aggiungi versioning per evitare cache issues
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      
      // Trasforma il template HTML con Vite per HMR e imports
      const page = await vite.transformIndexHtml(url, template);
      
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      // Fix dello stack trace per errori SSR
      vite.ssrFixStacktrace(e as Error);
      log(`Error serving ${url}: ${(e as Error).message}`, "vite-error");
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static files
  app.use(express.static(distPath));

  // ✅ Fallback to index.html per SPA routing (ma proteggi le API)
  app.use("*", (req, res) => {
    const url = req.originalUrl;
    
    // ✅ Anche in produzione, proteggi le API routes
    if (url.startsWith('/api')) {
      // In produzione, se arriva qui significa che l'API route non esiste
      return res.status(404).json({ 
        message: `API endpoint not found: ${url}` 
      });
    }
    
    // Serve index.html per tutte le altre routes (SPA routing)
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}