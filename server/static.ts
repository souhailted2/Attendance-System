import express, { type Express, type Request, type Response } from "express";
import fs from "fs";
import path from "path";

function setNoCacheHeaders(res: Response) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  const indexHtmlPath = path.resolve(distPath, "index.html");

  // Serve static assets (JS, CSS, images) WITHOUT serving index.html
  // index: false prevents express.static from serving index.html for directory requests
  app.use(express.static(distPath, { index: false }));

  // All non-asset routes serve index.html with strict no-cache headers
  app.use("/{*path}", (_req: Request, res: Response) => {
    setNoCacheHeaders(res);
    res.sendFile(indexHtmlPath);
  });
}
