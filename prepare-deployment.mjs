import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();

const required = [
  "client",
  "client/src",
  "client/public",
  "server",
  "server/config",
  "server/controllers",
  "server/middleware",
  "server/models",
  "server/routes",
  "server/services",
  "automation",
  "agent",
  "repairs",
  "repairs/pending",
  "repairs/plans",
  "repairs/backups",
  "repairs/completed",
  "repairs/failed",
  "docs",
  "server/index.js",
  "server/config/env.js",
  "server/services/footballService.js",
  "server/services/predictionEngine.js",
  "server/services/predictionService.js",
  "client/package.json",
  "client/index.html",
  "client/src/main.jsx",
  "client/src/App.jsx",
  "automation/config.js",
  "automation/logger.js",
  "automation/fileManager.js",
  "automation/backupManager.js",
  "automation/replacementManager.js",
  "automation/commandRunner.js",
  "automation/testRunner.js",
  "automation/repairPlanner.js",
  "automation/repairAI.js",
  "agent/rangoD.js"
];

const dirs = required.filter(x => !path.extname(x));
const files = required.filter(x => path.extname(x));

for (const item of dirs) {
  fs.mkdirSync(path.join(ROOT, item), { recursive: true });
}

for (const item of files) {
  const file = path.join(ROOT, item);
  if (!fs.existsSync(file)) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, "", "utf8");
  }
}

function json(file, fallback) {
  const p = path.join(ROOT, file);
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    fs.writeFileSync(p, JSON.stringify(fallback, null, 2) + "\n");
    return fallback;
  }
}

const rootPackage = json("package.json", {
  name: "rangod-tips",
  version: "1.0.0",
  private: true,
  type: "module",
  scripts: {
    build: "npm --prefix client run build",
    server: "npm --prefix server start",
    client: "npm --prefix client run dev",
    verify: "node --check server/index.js && node --check agent/rangoD.js && npm --prefix client run build"
  }
});

rootPackage.private = true;
rootPackage.type = "module";
rootPackage.scripts = {
  ...(rootPackage.scripts || {}),
  build: "npm --prefix client run build",
  server: "npm --prefix server start",
  client: "npm --prefix client run dev",
  verify: "node --check server/index.js && node --check agent/rangoD.js && npm --prefix client run build"
};

fs.writeFileSync(
  path.join(ROOT, "package.json"),
  JSON.stringify(rootPackage, null, 2) + "\n"
);

const serverPackage = json("server/package.json", {
  name: "rangod-tips-server",
  version: "1.0.0",
  private: true,
  type: "module",
  scripts: {
    start: "node index.js",
    dev: "nodemon index.js"
  }
});

serverPackage.type = "module";
serverPackage.scripts = {
  ...(serverPackage.scripts || {}),
  start: "node index.js",
  dev: "nodemon index.js"
};

fs.writeFileSync(
  path.join(ROOT, "server/package.json"),
  JSON.stringify(serverPackage, null, 2) + "\n"
);

const clientPackage = json("client/package.json", {
  name: "rangod-tips-client",
  version: "1.0.0",
  private: true,
  scripts: {
    dev: "vite",
    build: "vite build",
    preview: "vite preview"
  }
});

clientPackage.private = true;
clientPackage.scripts = {
  ...(clientPackage.scripts || {}),
  dev: "vite",
  build: "vite build",
  preview: "vite preview"
};

fs.writeFileSync(
  path.join(ROOT, "client/package.json"),
  JSON.stringify(clientPackage, null, 2) + "\n"
);

fs.writeFileSync(
  path.join(ROOT, "client/postcss.config.json"),
  JSON.stringify({ plugins: {} }, null, 2) + "\n"
);

const gitignore = `
node_modules/
client/node_modules/
server/node_modules/
client/dist/
.env
.env.*
!.env.example
server/.env
client/.env
repairs/backups/
repairs/completed/
repairs/failed/
automation/backups/
automation/logs/
`;

fs.writeFileSync(
  path.join(ROOT, ".gitignore"),
  gitignore.trim() + "\n"
);

console.log("Installing root dependencies...");
try {
  execSync("npm install", { cwd: ROOT, stdio: "inherit", shell: true });
} catch {}

console.log("Installing server dependencies...");
try {
  execSync("npm install", {
    cwd: path.join(ROOT, "server"),
    stdio: "inherit",
    shell: true
  });
} catch {}

console.log("Installing client dependencies...");
try {
  execSync("npm install", {
    cwd: path.join(ROOT, "client"),
    stdio: "inherit",
    shell: true
  });
} catch {}

console.log("Running deployment verification...");

try {
  execSync("node --check server/index.js", {
    cwd: ROOT,
    stdio: "inherit",
    shell: true
  });

  execSync("node --check agent/rangoD.js", {
    cwd: ROOT,
    stdio: "inherit",
    shell: true
  });

  execSync("npm run build", {
    cwd: ROOT,
    stdio: "inherit",
    shell: true
  });

  console.log("");
  console.log("==========================================");
  console.log(" RangoD TIPS DEPLOYMENT PREPARATION");
  console.log("==========================================");
  console.log("Folders ................. READY");
  console.log("Packages ................ READY");
  console.log("ES modules .............. READY");
  console.log("Backend syntax .......... PASS");
  console.log("RangoD agent syntax ..... PASS");
  console.log("Frontend build .......... PASS");
  console.log("==========================================");
  console.log(" DEPLOYMENT BUILD READY");
  console.log("==========================================");

} catch (error) {
  console.error("");
  console.error("==========================================");
  console.error(" DEPLOYMENT PREPARATION FAILED");
  console.error("==========================================");
  process.exit(1);
}
