#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_commander = require("commander");
var import_chalk3 = __toESM(require("chalk"));

// src/utils.ts
var fs = __toESM(require("fs-extra"));
var path = __toESM(require("path"));
var os = __toESM(require("os"));
var import_execa = require("execa");
var import_chalk = __toESM(require("chalk"));
var REPO_URL = "https://github.com/stillday/claude-code-skript.git";
var _gitExe = null;
function resolveGitExe() {
  if (_gitExe) return _gitExe;
  const { execSync, execFileSync } = require("child_process");
  try {
    execFileSync("git", ["--version"], { stdio: "pipe" });
    _gitExe = "git";
    return _gitExe;
  } catch {
  }
  try {
    execSync("git --version", { stdio: "pipe" });
    _gitExe = "git";
    return _gitExe;
  } catch {
  }
  try {
    const found = execSync("which git", { encoding: "utf8" }).trim();
    if (found) {
      _gitExe = found;
      return _gitExe;
    }
  } catch {
  }
  try {
    const found = execSync("where git", { encoding: "utf8" }).trim().split("\n")[0].trim();
    if (found) {
      _gitExe = found;
      return _gitExe;
    }
  } catch {
  }
  const candidates = [
    "C:\\Program Files\\Git\\cmd\\git.exe",
    "C:\\Program Files\\Git\\bin\\git.exe",
    "C:\\Program Files\\Git\\usr\\bin\\git.exe",
    "C:\\Program Files\\Git\\mingw64\\bin\\git.exe",
    path.join(os.homedir(), "AppData", "Local", "Programs", "Git", "cmd", "git.exe"),
    "C:\\Program Files (x86)\\Git\\cmd\\git.exe"
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      _gitExe = c;
      return _gitExe;
    }
  }
  throw new Error("git nicht gefunden");
}
var git = (...args) => (0, import_execa.execa)(resolveGitExe(), args, { stdio: "pipe" });
var SETUP_KIT_DIR = path.join(os.homedir(), ".claude", "setup-kit");
var CLAUDE_DIR = path.join(os.homedir(), ".claude");
var CONFIG_FILE = path.join(CLAUDE_DIR, "setup-kit.json");
function getTemplatesDir() {
  return path.join(SETUP_KIT_DIR, "project-templates");
}
function getGlobalClaudeMd() {
  return path.join(SETUP_KIT_DIR, "global-CLAUDE.md");
}
async function ensureSetupKit() {
  if (fs.existsSync(path.join(SETUP_KIT_DIR, "project-templates"))) return;
  console.log(import_chalk.default.cyan("\nErster Start: Lade Setup-Kit herunter..."));
  console.log(import_chalk.default.gray(`  Ziel: ${SETUP_KIT_DIR}
`));
  await fs.ensureDir(path.dirname(SETUP_KIT_DIR));
  try {
    await git("clone", REPO_URL, SETUP_KIT_DIR);
  } catch (err) {
    if (!fs.existsSync(path.join(SETUP_KIT_DIR, "project-templates"))) {
      console.error(import_chalk.default.red("  FEHLER: Klonen fehlgeschlagen."));
      console.error(import_chalk.default.yellow(`  Manuell versuchen: git clone ${REPO_URL} "${SETUP_KIT_DIR}"`));
      process.exit(1);
    }
  }
  console.log(import_chalk.default.green("\n  [OK] Setup-Kit heruntergeladen.\n"));
}
async function updateSetupKit() {
  if (!fs.existsSync(SETUP_KIT_DIR)) {
    await ensureSetupKit();
    return;
  }
  console.log(import_chalk.default.cyan("\nPruefe auf Updates..."));
  try {
    await git("-C", SETUP_KIT_DIR, "fetch", "origin");
    const { stdout: local } = await git("-C", SETUP_KIT_DIR, "rev-parse", "HEAD");
    const { stdout: remote } = await git("-C", SETUP_KIT_DIR, "rev-parse", "origin/master");
    if (local.trim() === remote.trim()) {
      console.log(import_chalk.default.green("  [OK] Bereits aktuell."));
      return;
    }
    const { stdout: log } = await git("-C", SETUP_KIT_DIR, "log", "--oneline", `${local.trim()}..${remote.trim()}`);
    console.log(import_chalk.default.yellow("\n  Neue Commits:"));
    log.split("\n").filter(Boolean).forEach((l) => console.log(import_chalk.default.gray(`    ${l}`)));
    await git("-C", SETUP_KIT_DIR, "pull", "origin", "master");
    const { stdout: newHash } = await git("-C", SETUP_KIT_DIR, "rev-parse", "HEAD");
    saveConfig({
      lastCommitHash: newHash.trim(),
      lastUpdateCheck: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      updateAvailable: false
    });
    console.log(import_chalk.default.green("\n  [OK] Update eingespielt."));
    reportClaudeMdChanges();
    console.log(import_chalk.default.bgYellow.black("\n  !! Session-Neustart empfohlen !!                              "));
    console.log(import_chalk.default.yellow("  Die neuen Regeln gelten erst ab der naechsten Session."));
    console.log(import_chalk.default.yellow("  Bitte diese Session beenden und Claude Code neu starten.\n"));
  } catch {
    console.error(import_chalk.default.red("  FEHLER beim Update-Check."));
  }
}
function parseMdSections(content) {
  const lines = content.split("\n");
  const sections = [];
  const preambleLines = [];
  let current = null;
  for (const line of lines) {
    if (/^## /.test(line)) {
      if (current) sections.push(current);
      current = { heading: line, body: "" };
    } else if (current) {
      current.body += line + "\n";
    } else {
      preambleLines.push(line);
    }
  }
  if (current) sections.push(current);
  return { preamble: preambleLines.join("\n"), sections };
}
function reportClaudeMdChanges() {
  const source = getGlobalClaudeMd();
  const target = path.join(CLAUDE_DIR, "CLAUDE.md");
  if (!fs.existsSync(source)) return;
  const newContent = fs.readFileSync(source, "utf8");
  const { sections: incomingSections } = parseMdSections(newContent);
  if (!fs.existsSync(target)) {
    console.log(import_chalk.default.yellow("\n=== Setup-Kit: Initiale CLAUDE.md ==="));
    console.log(import_chalk.default.white("~/.claude/CLAUDE.md existiert noch nicht."));
    console.log(import_chalk.default.white("Bitte ~/.claude/CLAUDE.md mit folgendem Inhalt anlegen:\n"));
    console.log(import_chalk.default.gray("--- INHALT ---"));
    console.log(newContent);
    console.log(import_chalk.default.gray("--- ENDE ---"));
    return;
  }
  const existingContent = fs.readFileSync(target, "utf8");
  const { sections: existingSections } = parseMdSections(existingContent);
  const existingHeadings = new Set(existingSections.map((s) => s.heading));
  const newSections = incomingSections.filter((s) => !existingHeadings.has(s.heading));
  const changedSections = incomingSections.filter((s) => {
    const existing = existingSections.find((e) => e.heading === s.heading);
    return existing && existing.body !== s.body;
  });
  if (newSections.length === 0 && changedSections.length === 0) {
    console.log(import_chalk.default.gray("  ~/.claude/CLAUDE.md: keine Aenderungen."));
    return;
  }
  console.log(import_chalk.default.yellow("\n=== Setup-Kit: Aenderungen in CLAUDE.md ==="));
  console.log(import_chalk.default.gray("Claude: Bitte diese Aenderungen intelligent in ~/.claude/CLAUDE.md"));
  console.log(import_chalk.default.gray("        integrieren. Bestehende Inhalte, Memories und eigene"));
  console.log(import_chalk.default.gray("        Anpassungen niemals loeschen oder ueberschreiben.\n"));
  if (newSections.length > 0) {
    console.log(import_chalk.default.cyan("NEUE SEKTIONEN (noch nicht vorhanden):"));
    for (const s of newSections) {
      console.log(import_chalk.default.green(`
+ ${s.heading}`));
      console.log(import_chalk.default.gray(s.body.trimEnd()));
    }
  }
  if (changedSections.length > 0) {
    console.log(import_chalk.default.cyan("\nGEAENDERTE SEKTIONEN (Template aktualisiert):"));
    for (const s of changedSections) {
      const existing = existingSections.find((e) => e.heading === s.heading);
      console.log(import_chalk.default.yellow(`
~ ${s.heading}`));
      console.log(import_chalk.default.gray("  Aktuell in deiner CLAUDE.md:"));
      existing.body.trimEnd().split("\n").forEach((l) => console.log(import_chalk.default.gray(`    ${l}`)));
      console.log(import_chalk.default.white("  Neue Version im Template:"));
      s.body.trimEnd().split("\n").forEach((l) => console.log(import_chalk.default.white(`    ${l}`)));
    }
  }
  console.log(import_chalk.default.yellow("\n=== Ende der Aenderungen ===\n"));
}
var UPDATE_INTERVAL_DAYS = 2;
async function checkForUpdatesInBackground() {
  if (!fs.existsSync(SETUP_KIT_DIR)) return;
  const config = loadConfig();
  const now = /* @__PURE__ */ new Date();
  if (config.lastUpdateCheck) {
    const lastCheck = new Date(config.lastUpdateCheck);
    const daysSince = (now.getTime() - lastCheck.getTime()) / (1e3 * 60 * 60 * 24);
    if (daysSince < UPDATE_INTERVAL_DAYS) return;
  }
  try {
    await (0, import_execa.execa)("git", ["-C", SETUP_KIT_DIR, "fetch", "origin"], { shell: true, timeout: 5e3 });
    const { stdout: local } = await git("-C", SETUP_KIT_DIR, "rev-parse", "HEAD");
    const { stdout: remote } = await git("-C", SETUP_KIT_DIR, "rev-parse", "origin/master");
    const updateAvailable = local.trim() !== remote.trim();
    saveConfig({
      lastUpdateCheck: now.toISOString().slice(0, 10),
      lastCommitHash: local.trim(),
      updateAvailable
    });
    if (updateAvailable) {
      console.log(import_chalk.default.yellow("\n  Update verfuegbar! Ausfuehren mit: setup-kit update\n"));
    }
  } catch {
  }
}
function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) return {};
  try {
    return fs.readJsonSync(CONFIG_FILE);
  } catch {
    return {};
  }
}
function saveConfig(config) {
  fs.ensureDirSync(CLAUDE_DIR);
  const existing = loadConfig();
  fs.writeJsonSync(CONFIG_FILE, { ...existing, ...config }, { spaces: 2 });
}
function getProjectsBase() {
  const config = loadConfig();
  if (config.projectsBase && fs.existsSync(config.projectsBase)) {
    return config.projectsBase;
  }
  const candidates = [
    "C:\\coding",
    "C:\\projects",
    "C:\\dev",
    "C:\\work",
    path.join(os.homedir(), "projects"),
    path.join(os.homedir(), "coding"),
    path.join(os.homedir(), "dev"),
    "D:\\coding",
    "D:\\projects"
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return os.homedir();
}
function replacePlaceholders(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, "utf8");
  for (const [key, value] of Object.entries(replacements)) {
    content = content.replaceAll(key, value);
  }
  fs.writeFileSync(filePath, content, "utf8");
}
function fillProjectBrief(filePath, ctx) {
  if (!fs.existsSync(filePath)) return;
  const features = ctx.features.split(",").map((f) => f.trim()).filter(Boolean);
  replacePlaceholders(filePath, {
    "[BESCHREIBUNG]": ctx.description,
    "[ZIELGRUPPE]": ctx.audience,
    "[PROJEKTTYP]": ctx.kind,
    "[FEATURE-1]": features[0] ?? "",
    "[FEATURE-2]": features[1] ?? "",
    "[FEATURE-3]": features[2] ?? ""
  });
}
async function gitInit(projectPath, userName, version) {
  await git("-C", projectPath, "init", "-b", "main");
  await git("-C", projectPath, "add", "-A");
  await git("-C", projectPath, "-c", `user.name=${userName}`, "-c", "user.email=setup@local", "commit", "-m", `chore: initial project setup [v${version}]`);
}
async function gitCommit(projectPath, userName, message) {
  await git("-C", projectPath, "add", "-A");
  await git("-C", projectPath, "-c", `user.name=${userName}`, "-c", "user.email=setup@local", "commit", "-m", message);
}

// src/wizard.ts
var fs2 = __toESM(require("fs-extra"));
var path2 = __toESM(require("path"));
var os2 = __toESM(require("os"));
var import_inquirer = __toESM(require("inquirer"));
var import_chalk2 = __toESM(require("chalk"));
async function checkPrerequisites() {
  console.log("");
  try {
    const { stdout } = await git("--version");
    console.log(import_chalk2.default.green(`  [OK] ${stdout.trim()}`));
  } catch {
    console.log(import_chalk2.default.yellow("  [ ] Git nicht gefunden \u2014 Git-Features (init, commit) nicht verfuegbar."));
    console.log(import_chalk2.default.gray("      Installieren: winget install Git.Git"));
  }
  try {
    await execa("claude", ["--version"]);
    console.log(import_chalk2.default.green("  [OK] Claude Code gefunden"));
  } catch {
    console.log(import_chalk2.default.yellow("  [ ] Claude Code nicht gefunden"));
    console.log(import_chalk2.default.gray("      npm install -g @anthropic/claude-code"));
  }
}
async function installGlobalClaudeMd(userName, force = false) {
  const source = getGlobalClaudeMd();
  const target = path2.join(CLAUDE_DIR, "CLAUDE.md");
  if (!fs2.existsSync(source)) {
    console.log(import_chalk2.default.red(`  FEHLER: global-CLAUDE.md nicht gefunden in: ${source}`));
    return;
  }
  if (fs2.existsSync(target) && !force) {
    const { overwrite } = await import_inquirer.default.prompt([{
      type: "confirm",
      name: "overwrite",
      message: "~/.claude/CLAUDE.md existiert. Ueberschreiben?",
      default: false
    }]);
    if (!overwrite) {
      console.log(import_chalk2.default.yellow("  Uebersprungen."));
      return;
    }
    const backup = `${target}.backup-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19)}`;
    fs2.copySync(target, backup);
    console.log(import_chalk2.default.gray(`  Backup: ${backup}`));
  }
  fs2.ensureDirSync(CLAUDE_DIR);
  fs2.copySync(source, target);
  replacePlaceholders(target, { "[USER]": userName });
  console.log(import_chalk2.default.green(`  [OK] ~/.claude/CLAUDE.md installiert (User: ${userName})`));
}
function checkSettings() {
  const f = path2.join(CLAUDE_DIR, "settings.json");
  if (!fs2.existsSync(f)) {
    console.log(import_chalk2.default.yellow("  HINWEIS: settings.json fehlt."));
    console.log(import_chalk2.default.yellow("           Kopiere settings-template.json nach ~/.claude/settings.json"));
  } else {
    console.log(import_chalk2.default.gray("  settings.json vorhanden."));
  }
}
function showSkillsStatus() {
  console.log(import_chalk2.default.cyan("\n--- Empfohlene Skills ---"));
  const skillsDir = path2.join(CLAUDE_DIR, "skills");
  const installed = fs2.existsSync(skillsDir) ? fs2.readdirSync(skillsDir).filter((f) => fs2.statSync(path2.join(skillsDir, f)).isDirectory()) : [];
  const skills = [
    { name: "svelte5-best-practices", cat: "Stack", prio: "HOCH" },
    { name: "sveltekit-svelte5-tailwind-skill", cat: "Stack", prio: "HOCH" },
    { name: "typescript-best-practices", cat: "Stack", prio: "HOCH" },
    { name: "vitest", cat: "Testing", prio: "HOCH" },
    { name: "owasp-security-check", cat: "Security", prio: "HOCH" },
    { name: "security-review", cat: "Security", prio: "HOCH" },
    { name: "git-commits", cat: "Workflow", prio: "HOCH" },
    { name: "commit-guardian", cat: "Workflow", prio: "HOCH" },
    { name: "adr-writer", cat: "Docs", prio: "HOCH" },
    { name: "database-migrations", cat: "Datenbank", prio: "MITTEL" },
    { name: "supabase-database", cat: "Datenbank", prio: "MITTEL" },
    { name: "accessibility-a11y", cat: "UI/UX", prio: "MITTEL" },
    { name: "performance-audit", cat: "Perf", prio: "MITTEL" },
    { name: "gdpr-dsgvo-expert", cat: "Legal", prio: "MITTEL" },
    { name: "logging-best-practices", cat: "Monitor", prio: "NIEDRIG" },
    { name: "context7-mcp", cat: "Docs", prio: "NIEDRIG" }
  ];
  for (const s of skills) {
    const ok = installed.includes(s.name);
    const icon = ok ? "[OK]" : "[  ]";
    const color = ok ? import_chalk2.default.green : s.prio === "HOCH" ? import_chalk2.default.red : import_chalk2.default.yellow;
    console.log(color(`  ${icon} ${s.prio.padEnd(8)} ${s.cat.padEnd(12)} ${s.name}`));
  }
  console.log(import_chalk2.default.gray("\n  Fehlende Skills: /find-skills [name]"));
}
async function getProjectContext() {
  console.log("");
  console.log(import_chalk2.default.white("=== Projekt-Kontext ==="));
  console.log(import_chalk2.default.gray("  Deine Antworten konfigurieren das Projekt automatisch."));
  console.log("");
  const answers = await import_inquirer.default.prompt([
    {
      type: "input",
      name: "description",
      message: "Was soll das Projekt koennen? (2-3 Saetze)"
    },
    {
      type: "input",
      name: "audience",
      message: 'Fuer wen ist es? (z.B. "interne Mitarbeiter", "Endkunden")'
    },
    {
      type: "input",
      name: "features",
      message: "Die 3 wichtigsten Features (kommagetrennt)"
    },
    {
      type: "list",
      name: "kind",
      message: "Projekttyp:",
      choices: [
        { name: "Kommerziell   (Produkt, SaaS, Shop)", value: "Kommerziell" },
        { name: "Internes Tool (Firma, Team)", value: "Internes Tool" },
        { name: "Hobby         (privates Projekt)", value: "Hobby" },
        { name: "Open Source   (oeffentlich)", value: "Open Source" }
      ]
    },
    {
      type: "confirm",
      name: "hasUserData",
      message: "Personenbezogene Nutzerdaten? --> aktiviert DSGVO-Agent",
      default: false
    },
    {
      type: "confirm",
      name: "hasDatabase",
      message: "Datenbank benoetigt?           --> aktiviert DBA-Agent",
      default: false
    },
    {
      type: "confirm",
      name: "isPerf",
      message: "Performance kritisch (hohe Last, Echtzeit)? --> PERF-Agent",
      default: false
    }
  ]);
  return answers;
}
function installCiCd(projectPath, provider, versioning, templatesDir, gitlabUrl) {
  const vSuffix = versioning === "calver" ? "calver" : "semver";
  if (provider === "github") {
    const wfDir = path2.join(projectPath, ".github", "workflows");
    fs2.ensureDirSync(wfDir);
    fs2.copySync(
      path2.join(templatesDir, ".github", "workflows", `bump-version-${vSuffix}.yml`),
      path2.join(wfDir, "bump-version.yml")
    );
    console.log(import_chalk2.default.green("  [OK] GitHub Actions: .github/workflows/bump-version.yml"));
    console.log(import_chalk2.default.yellow("\n  === GitHub PAT einrichten ==="));
    console.log(import_chalk2.default.white("  1. GitHub > Settings > Developer settings > Personal access tokens"));
    console.log(import_chalk2.default.white("  2. Scopes: repo, workflow"));
    console.log(import_chalk2.default.white("  3. Repo > Settings > Secrets > GH_PAT = <dein token>"));
  } else if (provider === "gitlab-cloud" || provider === "gitlab-self") {
    const src = path2.join(templatesDir, ".gitlab", `bump-version-${vSuffix}.yml`);
    const dest = path2.join(projectPath, ".gitlab-ci.yml");
    fs2.copySync(src, dest);
    if (provider === "gitlab-self" && gitlabUrl) {
      replacePlaceholders(dest, { "https://gitlab.com": gitlabUrl });
    }
    console.log(import_chalk2.default.green("  [OK] GitLab CI: .gitlab-ci.yml"));
    console.log(import_chalk2.default.yellow("\n  === GitLab Token einrichten ==="));
    console.log(import_chalk2.default.white("  1. GitLab > Profil > Access Tokens (Scopes: api, read/write_repository)"));
    console.log(import_chalk2.default.white("  2. Repo > Settings > CI/CD > Variables > CI_BUMP_TOKEN"));
  }
}
function installGitignore(projectPath) {
  const target = path2.join(projectPath, ".gitignore");
  if (fs2.existsSync(target)) return;
  const content = [
    "# Environment",
    ".env",
    ".env.local",
    ".env.*.local",
    "",
    "# Node / Build",
    "node_modules/",
    ".svelte-kit/",
    "build/",
    "dist/",
    ".output/",
    "",
    "# OS",
    ".DS_Store",
    "Thumbs.db",
    "",
    "# Editor",
    ".vscode/settings.json",
    ".idea/",
    "",
    "# Logs",
    "*.log",
    "npm-debug.log*",
    ""
  ].join("\n");
  fs2.writeFileSync(target, content, "utf8");
  console.log(import_chalk2.default.green("  [OK] .gitignore erstellt"));
}
async function installNewProject(projectPath, name, type, provider, versioning, userName, ctx) {
  const templatesDir = getTemplatesDir();
  console.log(import_chalk2.default.cyan(`
--- Erstelle Projekt: ${name} [${type}, ${provider}, ${versioning}] ---`));
  const tmpl = type === "sveltekit" ? "sveltekit-CLAUDE.md" : "generic-CLAUDE.md";
  const claudeTarget = path2.join(projectPath, "CLAUDE.md");
  fs2.copySync(path2.join(templatesDir, tmpl), claudeTarget);
  replacePlaceholders(claudeTarget, {
    "[USER]": userName,
    "[PROJEKT-NAME]": name,
    "[GIT-PROVIDER]": provider,
    "[VERSIONIERUNG]": versioning
  });
  console.log(import_chalk2.default.green("  [OK] CLAUDE.md"));
  const agentsDir = path2.join(projectPath, ".claude", "agents");
  fs2.ensureDirSync(agentsDir);
  const agentsSrc = path2.join(templatesDir, ".claude", "agents");
  const baseAgents = ["pm.md", "be.md", "fe.md", "qa.md", "sec.md"];
  for (const a of baseAgents) {
    const dest = path2.join(agentsDir, a);
    fs2.copySync(path2.join(agentsSrc, a), dest);
    replacePlaceholders(dest, { "[USER]": userName, "[PROJEKT-NAME]": name });
  }
  const extras = [];
  if (ctx.hasUserData) {
    const dest = path2.join(agentsDir, "dsgvo.md");
    fs2.copySync(path2.join(agentsSrc, "dsgvo.md"), dest);
    replacePlaceholders(dest, { "[USER]": userName });
    extras.push("DSGVO");
  }
  if (ctx.hasDatabase) {
    const dest = path2.join(agentsDir, "dba.md");
    fs2.copySync(path2.join(agentsSrc, "dba.md"), dest);
    replacePlaceholders(dest, { "[USER]": userName });
    extras.push("DBA");
  }
  if (ctx.isPerf) {
    const dest = path2.join(agentsDir, "perf.md");
    fs2.copySync(path2.join(agentsSrc, "perf.md"), dest);
    replacePlaceholders(dest, { "[USER]": userName });
    extras.push("PERF");
  }
  const agentList = ["PM", "BE", "FE", "QA", "SEC", ...extras].join(", ");
  console.log(import_chalk2.default.green(`  [OK] Agents: ${agentList}`));
  const docsAdrDir = path2.join(projectPath, "docs", "adr");
  fs2.ensureDirSync(docsAdrDir);
  const adrTemplate = path2.join(projectPath, "docs", "adr", "ADR-000-template.md");
  fs2.copySync(path2.join(templatesDir, "docs", "adr", "ADR-000-template.md"), adrTemplate);
  replacePlaceholders(adrTemplate, { "[USER]": userName });
  const failedTarget = path2.join(projectPath, "docs", "failed-approaches.md");
  fs2.copySync(path2.join(templatesDir, "docs", "failed-approaches.md"), failedTarget);
  const briefTarget = path2.join(projectPath, "docs", "project-brief.md");
  if (fs2.existsSync(path2.join(templatesDir, "docs", "project-brief.md"))) {
    fs2.copySync(path2.join(templatesDir, "docs", "project-brief.md"), briefTarget);
    replacePlaceholders(briefTarget, { "[USER]": userName, "[PROJEKT-NAME]": name });
    fillProjectBrief(briefTarget, ctx);
  }
  const planningDir = path2.join(projectPath, ".planning");
  fs2.ensureDirSync(planningDir);
  fs2.ensureDirSync(path2.join(projectPath, "docs", "planning-history"));
  const planSrc = path2.join(templatesDir, "docs", ".planning");
  if (fs2.existsSync(planSrc)) {
    for (const f of ["PLAN-template.md", "STATE-template.md", "config.json"]) {
      if (fs2.existsSync(path2.join(planSrc, f))) {
        fs2.copySync(path2.join(planSrc, f), path2.join(planningDir, f));
      }
    }
  }
  const gitignorePath = path2.join(projectPath, ".gitignore");
  if (fs2.existsSync(gitignorePath)) {
    const content = fs2.readFileSync(gitignorePath, "utf8");
    if (!content.includes(".planning/")) {
      fs2.appendFileSync(gitignorePath, "\n# Planning state\n.planning/\n!docs/planning-history/\n");
    }
  }
  console.log(import_chalk2.default.green("  [OK] Docs: docs/adr/, failed-approaches.md, project-brief.md, .planning/"));
  fs2.ensureDirSync(path2.join(projectPath, "scripts"));
  const bumpSrc = versioning === "calver" ? "bump-version-calver.sh" : "bump-version-semver.sh";
  fs2.copySync(
    path2.join(templatesDir, "scripts", bumpSrc),
    path2.join(projectPath, "scripts", "bump-version.sh")
  );
  fs2.copySync(
    path2.join(templatesDir, "scripts", "init-version.sh"),
    path2.join(projectPath, "scripts", "init-version.sh")
  );
  console.log(import_chalk2.default.green("  [OK] Scripts: bump-version.sh, init-version.sh"));
  let gitlabUrl;
  if (provider === "gitlab-self") {
    const { url } = await import_inquirer.default.prompt([{
      type: "input",
      name: "url",
      message: "Self-Hosted GitLab URL (z.B. https://gitlab.meinefirma.de)"
    }]);
    gitlabUrl = url;
  }
  installCiCd(projectPath, provider, versioning, templatesDir, gitlabUrl);
  const vFile = path2.join(projectPath, "VERSION");
  let versionStr;
  if (versioning === "calver") {
    const d = /* @__PURE__ */ new Date();
    const counter = Math.floor(1e3 + Math.random() * 1e3);
    const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    versionStr = `${dateStr}.${counter}`;
    fs2.writeFileSync(vFile, versionStr, "utf8");
    fs2.writeFileSync(path2.join(projectPath, "VERSION.counter"), String(counter), "utf8");
    console.log(import_chalk2.default.green(`  [OK] VERSION: ${versionStr} (CalVer)`));
  } else {
    versionStr = "0.1.0";
    fs2.writeFileSync(vFile, versionStr, "utf8");
    console.log(import_chalk2.default.green("  [OK] VERSION: 0.1.0 (SemVer)"));
  }
  installGitignore(projectPath);
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  fs2.appendFileSync(claudeTarget, `

---

> Setup-Kit: ${REPO_URL}
> Installation: ${today}
`);
  console.log(import_chalk2.default.white("\n  Initialisiere Git-Repo..."));
  await gitInit(projectPath, userName, versionStr);
  console.log(import_chalk2.default.green(`  [OK] Git: main-Branch, erster Commit v${versionStr}`));
  if (provider !== "none") {
    console.log(import_chalk2.default.yellow("\n  NAECHSTER SCHRITT: Remote verbinden"));
    console.log(import_chalk2.default.yellow("  git remote add origin <repo-url> && git push -u origin main"));
  }
}
async function updateExistingProject(projectPath, name, type, provider, versioning, userName) {
  const templatesDir = getTemplatesDir();
  console.log(import_chalk2.default.cyan(`
--- Analyse: ${name} (bestehendes Projekt) ---`));
  const hasClaude = fs2.existsSync(path2.join(projectPath, "CLAUDE.md"));
  const hasAgents = fs2.existsSync(path2.join(projectPath, ".claude", "agents"));
  const hasDocs = fs2.existsSync(path2.join(projectPath, "docs", "adr"));
  const hasScripts = fs2.existsSync(path2.join(projectPath, "scripts", "bump-version.sh"));
  const hasVersion = fs2.existsSync(path2.join(projectPath, "VERSION"));
  const hasCi = fs2.existsSync(path2.join(projectPath, ".github", "workflows")) || fs2.existsSync(path2.join(projectPath, ".gitlab-ci.yml"));
  const hasGitignore = fs2.existsSync(path2.join(projectPath, ".gitignore"));
  const hasPlanning = fs2.existsSync(path2.join(projectPath, ".planning"));
  console.log("");
  const status = (label, exists) => {
    const icon = exists ? "[OK]" : "[  ]";
    console.log(exists ? import_chalk2.default.green(`  ${icon} ${label}`) : import_chalk2.default.yellow(`  ${icon} ${label}`));
  };
  status("CLAUDE.md", hasClaude);
  status(".claude/agents/", hasAgents);
  status("docs/adr/", hasDocs);
  status("scripts/bump-version.sh", hasScripts);
  status("VERSION", hasVersion);
  status("CI/CD", hasCi);
  status(".planning/", hasPlanning);
  console.log("");
  const added = [];
  if (!hasClaude) {
    const { add } = await import_inquirer.default.prompt([{ type: "confirm", name: "add", message: "CLAUDE.md hinzufuegen?", default: true }]);
    if (add) {
      const tmpl = type === "sveltekit" ? "sveltekit-CLAUDE.md" : "generic-CLAUDE.md";
      fs2.copySync(path2.join(templatesDir, tmpl), path2.join(projectPath, "CLAUDE.md"));
      replacePlaceholders(path2.join(projectPath, "CLAUDE.md"), {
        "[USER]": userName,
        "[PROJEKT-NAME]": name,
        "[GIT-PROVIDER]": provider,
        "[VERSIONIERUNG]": versioning
      });
      console.log(import_chalk2.default.green("  [OK] CLAUDE.md"));
      added.push("CLAUDE.md");
    }
  }
  if (!hasAgents) {
    const { add } = await import_inquirer.default.prompt([{ type: "confirm", name: "add", message: "Agent-Dateien hinzufuegen (.claude/agents/)?", default: true }]);
    if (add) {
      const agentsDir = path2.join(projectPath, ".claude", "agents");
      fs2.ensureDirSync(agentsDir);
      const agentsSrc = path2.join(templatesDir, ".claude", "agents");
      for (const a of ["pm.md", "be.md", "fe.md", "qa.md", "sec.md"]) {
        const dest = path2.join(agentsDir, a);
        fs2.copySync(path2.join(agentsSrc, a), dest);
        replacePlaceholders(dest, { "[USER]": userName, "[PROJEKT-NAME]": name });
      }
      console.log(import_chalk2.default.green("  [OK] Agents: PM, BE, FE, QA, SEC"));
      for (const [file, label] of [["dsgvo.md", "DSGVO"], ["dba.md", "DBA"], ["perf.md", "PERF"]]) {
        const { add: addOpt } = await import_inquirer.default.prompt([{ type: "confirm", name: "add", message: `  ${label}-Agent hinzufuegen?`, default: false }]);
        if (addOpt) {
          const dest = path2.join(agentsDir, file);
          fs2.copySync(path2.join(agentsSrc, file), dest);
          replacePlaceholders(dest, { "[USER]": userName });
          console.log(import_chalk2.default.green(`  [OK] Agent: ${label}`));
        }
      }
      added.push(".claude/agents/");
    }
  }
  if (!hasDocs) {
    const { add } = await import_inquirer.default.prompt([{ type: "confirm", name: "add", message: "Docs-Struktur hinzufuegen (docs/adr/ etc.)?", default: true }]);
    if (add) {
      fs2.ensureDirSync(path2.join(projectPath, "docs", "adr"));
      const adrTemplate = path2.join(projectPath, "docs", "adr", "ADR-000-template.md");
      fs2.copySync(path2.join(templatesDir, "docs", "adr", "ADR-000-template.md"), adrTemplate);
      replacePlaceholders(adrTemplate, { "[USER]": userName });
      if (!fs2.existsSync(path2.join(projectPath, "docs", "failed-approaches.md"))) {
        fs2.copySync(path2.join(templatesDir, "docs", "failed-approaches.md"), path2.join(projectPath, "docs", "failed-approaches.md"));
      }
      console.log(import_chalk2.default.green("  [OK] Docs: docs/adr/, failed-approaches.md"));
      added.push("docs/");
    }
  }
  if (!hasPlanning) {
    const { add } = await import_inquirer.default.prompt([{ type: "confirm", name: "add", message: ".planning/ hinzufuegen (PM-Agent Wave-Modell)?", default: false }]);
    if (add) {
      fs2.ensureDirSync(path2.join(projectPath, ".planning"));
      fs2.ensureDirSync(path2.join(projectPath, "docs", "planning-history"));
      const planSrc = path2.join(templatesDir, "docs", ".planning");
      if (fs2.existsSync(planSrc)) {
        for (const f of ["PLAN-template.md", "STATE-template.md", "config.json"]) {
          if (fs2.existsSync(path2.join(planSrc, f))) {
            fs2.copySync(path2.join(planSrc, f), path2.join(projectPath, ".planning", f));
          }
        }
      }
      console.log(import_chalk2.default.green("  [OK] .planning/"));
      added.push(".planning/");
    }
  }
  if (!hasScripts) {
    const { add } = await import_inquirer.default.prompt([{ type: "confirm", name: "add", message: "Versionierungs-Scripts hinzufuegen?", default: true }]);
    if (add) {
      let ver = versioning;
      if (!ver) {
        const { v } = await import_inquirer.default.prompt([{
          type: "list",
          name: "v",
          message: "Versionierung:",
          choices: [{ name: "CalVer (2026.0321.1847)", value: "calver" }, { name: "SemVer (1.2.3)", value: "semver" }]
        }]);
        ver = v;
      }
      fs2.ensureDirSync(path2.join(projectPath, "scripts"));
      const bumpSrc = ver === "calver" ? "bump-version-calver.sh" : "bump-version-semver.sh";
      fs2.copySync(path2.join(templatesDir, "scripts", bumpSrc), path2.join(projectPath, "scripts", "bump-version.sh"));
      fs2.copySync(path2.join(templatesDir, "scripts", "init-version.sh"), path2.join(projectPath, "scripts", "init-version.sh"));
      console.log(import_chalk2.default.green("  [OK] Scripts: bump-version.sh, init-version.sh"));
      if (!hasVersion) {
        const vFile = path2.join(projectPath, "VERSION");
        if (ver === "calver") {
          const d = /* @__PURE__ */ new Date();
          const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
          const counter = Math.floor(1e3 + Math.random() * 1e3);
          fs2.writeFileSync(vFile, `${dateStr}.${counter}`, "utf8");
        } else {
          fs2.writeFileSync(vFile, "0.1.0", "utf8");
        }
        console.log(import_chalk2.default.green(`  [OK] VERSION: ${fs2.readFileSync(vFile, "utf8")}`));
      }
      added.push("scripts/");
    }
  }
  if (!hasCi) {
    const { add } = await import_inquirer.default.prompt([{ type: "confirm", name: "add", message: "CI/CD Workflow hinzufuegen?", default: false }]);
    if (add) {
      let prov = provider;
      if (!prov) {
        const { p } = await import_inquirer.default.prompt([{
          type: "list",
          name: "p",
          message: "Git-Provider:",
          choices: [
            { name: "GitHub", value: "github" },
            { name: "GitLab Cloud", value: "gitlab-cloud" },
            { name: "GitLab Self-Hosted", value: "gitlab-self" },
            { name: "Keiner", value: "none" }
          ]
        }]);
        prov = p;
      }
      let ver = versioning;
      if (!ver) {
        const vFile = path2.join(projectPath, "VERSION");
        const vContent = fs2.existsSync(vFile) ? fs2.readFileSync(vFile, "utf8") : "";
        ver = /^\d{4}\./.test(vContent) ? "calver" : "semver";
      }
      let gitlabUrl;
      if (prov === "gitlab-self") {
        const { url } = await import_inquirer.default.prompt([{ type: "input", name: "url", message: "GitLab URL:" }]);
        gitlabUrl = url;
      }
      installCiCd(projectPath, prov, ver, getTemplatesDir(), gitlabUrl);
      added.push("CI/CD");
    }
  }
  if (!hasGitignore) {
    const { add } = await import_inquirer.default.prompt([{ type: "confirm", name: "add", message: ".gitignore erstellen?", default: true }]);
    if (add) {
      installGitignore(projectPath);
      added.push(".gitignore");
    }
  }
  if (added.length > 0) {
    const { doCommit } = await import_inquirer.default.prompt([{
      type: "confirm",
      name: "doCommit",
      message: `Aenderungen committen? (${added.join(", ")})`,
      default: true
    }]);
    if (doCommit) {
      await gitCommit(projectPath, userName, `chore: add claude-code setup (${added.join(", ")})`);
      console.log(import_chalk2.default.green("  [OK] Commit erstellt"));
    }
  } else {
    console.log(import_chalk2.default.gray("  Nichts hinzugefuegt."));
  }
}
async function runProjectWizard(userName) {
  const projectsBase = getProjectsBase();
  const cwd = process.cwd();
  console.log("");
  console.log(import_chalk2.default.gray(`  Aktueller Ordner: ${cwd}`));
  console.log(import_chalk2.default.gray("  Enter = aktuellen Ordner verwenden, oder Namen/Pfad eingeben"));
  const { pathInput } = await import_inquirer.default.prompt([{
    type: "input",
    name: "pathInput",
    message: "Projektordner:",
    default: "."
  }]);
  let projectPath;
  if (!pathInput || pathInput === ".") {
    projectPath = cwd;
  } else if (/^[A-Za-z]:[/\\]/.test(pathInput)) {
    projectPath = pathInput;
  } else {
    projectPath = path2.join(projectsBase, pathInput);
  }
  console.log(import_chalk2.default.cyan(`  Zielordner: ${projectPath}`));
  if (!fs2.existsSync(projectPath)) {
    const { create } = await import_inquirer.default.prompt([{
      type: "confirm",
      name: "create",
      message: `Ordner '${projectPath}' erstellen?`,
      default: true
    }]);
    if (!create) return;
    fs2.ensureDirSync(projectPath);
    console.log(import_chalk2.default.green("  Ordner erstellt."));
  }
  const defaultName = path2.basename(projectPath);
  const { name } = await import_inquirer.default.prompt([{
    type: "input",
    name: "name",
    message: "Projekt-Name:",
    default: defaultName
  }]);
  saveConfig({ projectsBase: path2.dirname(projectPath) });
  const isExisting = fs2.existsSync(path2.join(projectPath, ".git"));
  const hasSvelte = fs2.existsSync(path2.join(projectPath, "svelte.config.js")) || fs2.existsSync(path2.join(projectPath, "svelte.config.ts")) || fs2.existsSync(path2.join(projectPath, "src", "app.html"));
  if (isExisting) {
    console.log(import_chalk2.default.cyan("\n  Modus: Bestehendes Projekt erweitern"));
    const detectedType = hasSvelte ? "sveltekit" : "generic";
    console.log(import_chalk2.default.gray(`  Erkannter Typ: ${detectedType}`));
    await updateExistingProject(projectPath, name, detectedType, "", "", userName);
  } else {
    console.log(import_chalk2.default.cyan("\n  Modus: Neues Projekt erstellen"));
    const ctx = await getProjectContext();
    const { type } = await import_inquirer.default.prompt([{
      type: "list",
      name: "type",
      message: "Projekttyp:",
      choices: [
        { name: "SvelteKit (SvelteKit + Svelte 5 + Tailwind)", value: "sveltekit" },
        { name: "Generic   (beliebiges Projekt)", value: "generic" }
      ]
    }]);
    const { provider } = await import_inquirer.default.prompt([{
      type: "list",
      name: "provider",
      message: "Git-Provider:",
      choices: [
        { name: "GitHub", value: "github" },
        { name: "GitLab Cloud", value: "gitlab-cloud" },
        { name: "GitLab Self-Hosted", value: "gitlab-self" },
        { name: "Keiner", value: "none" }
      ]
    }]);
    const { versioning } = await import_inquirer.default.prompt([{
      type: "list",
      name: "versioning",
      message: "Versionierung:",
      choices: [
        { name: "CalVer (2026.0321.1847 - automatisch)", value: "calver" },
        { name: "SemVer (1.2.3 - manuell)", value: "semver" }
      ]
    }]);
    await installNewProject(projectPath, name, type, provider, versioning, userName, ctx);
  }
  console.log(import_chalk2.default.cyan(`
=== Projekt '${name}' eingerichtet ===`));
  console.log(import_chalk2.default.white(`  cd '${projectPath}'`));
  console.log(import_chalk2.default.white("  claude"));
  console.log(import_chalk2.default.white("  > Im Chat: /discover"));
  console.log("");
}
async function runWizard() {
  console.log("");
  console.log(import_chalk2.default.cyan("================================================="));
  console.log(import_chalk2.default.cyan("  Claude Code Setup Kit"));
  console.log(import_chalk2.default.cyan("================================================="));
  await checkPrerequisites();
  console.log("");
  const { userName } = await import_inquirer.default.prompt([{
    type: "input",
    name: "userName",
    message: "Dein Name (wird in alle Templates eingesetzt):",
    default: os2.userInfo().username
  }]);
  console.log(import_chalk2.default.cyan(`
=== Claude Code Setup fuer: ${userName} ===`));
  const { action } = await import_inquirer.default.prompt([{
    type: "list",
    name: "action",
    message: "Was moechtest du tun?",
    choices: [
      { name: "Neues Projekt anlegen", value: "new" },
      { name: "Bestehendes Projekt erweitern", value: "update" },
      { name: "Nur globales Setup (CLAUDE.md)", value: "global" },
      { name: "Skills-Status anzeigen", value: "skills" }
    ]
  }]);
  if (action === "global") {
    console.log("");
    await installGlobalClaudeMd(userName, false);
  } else {
    const globalTarget = path2.join(CLAUDE_DIR, "CLAUDE.md");
    if (!fs2.existsSync(globalTarget)) {
      console.log("");
      await installGlobalClaudeMd(userName, false);
    } else {
      console.log(import_chalk2.default.gray("  ~/.claude/CLAUDE.md bereits vorhanden."));
    }
  }
  console.log("");
  checkSettings();
  if (action === "new" || action === "update") {
    await runProjectWizard(userName);
  }
  if (action === "skills") {
    showSkillsStatus();
  }
}

// src/index.ts
var program = new import_commander.Command();
program.name("setup-kit").description("Claude Code Setup Kit - portables Projekt-Setup-Tool").version("1.0.0");
program.action(async () => {
  await ensureSetupKit();
  checkForUpdatesInBackground();
  await runWizard();
});
program.command("update").description("Setup-Kit auf den neuesten Stand bringen").action(async () => {
  await updateSetupKit();
});
program.command("status").description("Voraussetzungen und installierte Skills pruefen").action(async () => {
  console.log(import_chalk3.default.cyan("\n=== Setup-Kit Status ==="));
  await checkPrerequisites();
  console.log("");
});
program.parseAsync(process.argv).catch((err) => {
  console.error(import_chalk3.default.red("\nFehler:"), err instanceof Error ? err.message : String(err));
  process.exit(1);
});
