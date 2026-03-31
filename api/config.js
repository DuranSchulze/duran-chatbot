import fs from "node:fs";
import path from "node:path";

const configPath = path.join(process.cwd(), "data", "config.json");

function readConfig() {
  const file = fs.readFileSync(configPath, "utf8");
  return JSON.parse(file);
}

export default function handler(req, res) {
  if (req.method === "GET") {
    try {
      const config = readConfig();
      res.setHeader("Content-Type", "application/json");
      res.status(200).send(JSON.stringify(config));
    } catch (error) {
      res.status(500).json({
        error: "Failed to read config",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
    return;
  }

  if (req.method === "POST") {
    res.status(501).json({
      error: "Saving config is not configured for this Vercel deployment yet.",
    });
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ error: "Method not allowed" });
}

