import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const adminRoot = path.resolve(__dirname, "..");
const widgetBundlePath = path.resolve(adminRoot, "../../packages/widget/dist/widget.umd.js");
const publicDir = path.resolve(adminRoot, "public");
const publicWidgetPath = path.resolve(publicDir, "widget.js");

if (!fs.existsSync(widgetBundlePath)) {
  throw new Error(
    `Widget bundle not found at ${widgetBundlePath}. Build packages/widget before apps/admin.`,
  );
}

fs.mkdirSync(publicDir, { recursive: true });
fs.copyFileSync(widgetBundlePath, publicWidgetPath);

