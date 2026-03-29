import * as fs from 'fs-extra'
import * as path from 'path'
import * as os from 'os'
import { execa } from 'execa'
import chalk from 'chalk'

// ============================================================
// PFADE
// ============================================================

export const REPO_URL = 'https://github.com/stillday/claude-code-skript.git'
export const SETUP_KIT_DIR = path.join(os.homedir(), '.claude', 'setup-kit')
export const CLAUDE_DIR = path.join(os.homedir(), '.claude')
export const CONFIG_FILE = path.join(CLAUDE_DIR, 'setup-kit.json')

export function getTemplatesDir(): string {
  return path.join(SETUP_KIT_DIR, 'project-templates')
}

export function getGlobalClaudeMd(): string {
  return path.join(SETUP_KIT_DIR, 'global-CLAUDE.md')
}

// ============================================================
// SETUP-KIT REPO — erster Start / Update
// ============================================================

export async function ensureSetupKit(): Promise<void> {
  if (fs.existsSync(path.join(SETUP_KIT_DIR, 'project-templates'))) return

  console.log(chalk.cyan('\nErster Start: Lade Setup-Kit herunter...'))
  console.log(chalk.gray(`  Ziel: ${SETUP_KIT_DIR}\n`))

  await fs.ensureDir(path.dirname(SETUP_KIT_DIR))

  try {
    await execa('git', ['clone', REPO_URL, SETUP_KIT_DIR], { stdio: 'pipe' })
  } catch (err) {
    // Nochmal pruefen — auf Windows meldet git clone manchmal Fehler obwohl es geklappt hat
    if (!fs.existsSync(path.join(SETUP_KIT_DIR, 'project-templates'))) {
      console.error(chalk.red('  FEHLER: Klonen fehlgeschlagen.'))
      console.error(chalk.yellow(`  Manuell versuchen: git clone ${REPO_URL} "${SETUP_KIT_DIR}"`))
      process.exit(1)
    }
  }
  console.log(chalk.green('\n  [OK] Setup-Kit heruntergeladen.\n'))
}

export async function updateSetupKit(): Promise<void> {
  if (!fs.existsSync(SETUP_KIT_DIR)) {
    await ensureSetupKit()
    return
  }

  console.log(chalk.cyan('\nPruefe auf Updates...'))
  try {
    await execa('git', ['-C', SETUP_KIT_DIR, 'fetch', 'origin'], { stdio: 'pipe' })
    const { stdout: local } = await execa('git', ['-C', SETUP_KIT_DIR, 'rev-parse', 'HEAD'])
    const { stdout: remote } = await execa('git', ['-C', SETUP_KIT_DIR, 'rev-parse', 'origin/master'])

    if (local.trim() === remote.trim()) {
      console.log(chalk.green('  [OK] Bereits aktuell.'))
      return
    }

    const { stdout: log } = await execa('git', [
      '-C', SETUP_KIT_DIR, 'log', '--oneline', `${local.trim()}..${remote.trim()}`
    ])
    console.log(chalk.yellow('\n  Neue Commits:'))
    log.split('\n').filter(Boolean).forEach(l => console.log(chalk.gray(`    ${l}`)))

    await execa('git', ['-C', SETUP_KIT_DIR, 'pull', 'origin', 'master'], { stdio: 'inherit' })
    const { stdout: newHash } = await execa('git', ['-C', SETUP_KIT_DIR, 'rev-parse', 'HEAD'])
    saveConfig({
      lastCommitHash: newHash.trim(),
      lastUpdateCheck: new Date().toISOString().slice(0, 10),
      updateAvailable: false,
    })
    console.log(chalk.green('\n  [OK] Update eingespielt.'))

    // Aenderungen ausgeben — Claude integriert sie selbst intelligent
    reportClaudeMdChanges()

    console.log(chalk.bgYellow.black('\n  !! Session-Neustart empfohlen !!                              '))
    console.log(chalk.yellow('  Die neuen Regeln gelten erst ab der naechsten Session.'))
    console.log(chalk.yellow('  Bitte diese Session beenden und Claude Code neu starten.\n'))
  } catch {
    console.error(chalk.red('  FEHLER beim Update-Check.'))
  }
}

// ============================================================
// CLAUDE.MD SECTION-MERGE
// Neue Sektionen werden ergaenzt, geaenderte aktualisiert.
// Eigene Inhalte (Memories, Projekt-Infos) bleiben IMMER erhalten.
// ============================================================

interface MdSection {
  heading: string  // z.B. "## Auto-Update: Setup-Kit"
  body: string     // Inhalt unterhalb der Ueberschrift
}

function parseMdSections(content: string): { preamble: string; sections: MdSection[] } {
  const lines = content.split('\n')
  const sections: MdSection[] = []
  const preambleLines: string[] = []
  let current: MdSection | null = null

  for (const line of lines) {
    if (/^## /.test(line)) {
      if (current) sections.push(current)
      current = { heading: line, body: '' }
    } else if (current) {
      current.body += line + '\n'
    } else {
      preambleLines.push(line)
    }
  }
  if (current) sections.push(current)

  return { preamble: preambleLines.join('\n'), sections }
}

function buildMdContent(preamble: string, sections: MdSection[]): string {
  const parts = [preamble.trimEnd()]
  for (const s of sections) {
    parts.push('\n' + s.heading + '\n' + s.body.trimEnd())
  }
  return parts.join('\n') + '\n'
}

/**
 * Vergleicht global-CLAUDE.md mit ~/.claude/CLAUDE.md und gibt
 * strukturierte Aenderungen aus — Claude integriert sie selbst intelligent.
 *
 * Die CLI schreibt NICHT automatisch. Claude liest den Output und entscheidet
 * mit Kontext und Verstand wie die Aenderungen eingebaut werden.
 */
export function reportClaudeMdChanges(): void {
  const source = getGlobalClaudeMd()
  const target = path.join(CLAUDE_DIR, 'CLAUDE.md')

  if (!fs.existsSync(source)) return

  const newContent = fs.readFileSync(source, 'utf8')
  const { sections: incomingSections } = parseMdSections(newContent)

  // Erste Installation: noch keine CLAUDE.md vorhanden
  if (!fs.existsSync(target)) {
    console.log(chalk.yellow('\n=== Setup-Kit: Initiale CLAUDE.md ==='))
    console.log(chalk.white('~/.claude/CLAUDE.md existiert noch nicht.'))
    console.log(chalk.white('Bitte ~/.claude/CLAUDE.md mit folgendem Inhalt anlegen:\n'))
    console.log(chalk.gray('--- INHALT ---'))
    console.log(newContent)
    console.log(chalk.gray('--- ENDE ---'))
    return
  }

  const existingContent = fs.readFileSync(target, 'utf8')
  const { sections: existingSections } = parseMdSections(existingContent)
  const existingHeadings = new Set(existingSections.map(s => s.heading))

  const newSections = incomingSections.filter(s => !existingHeadings.has(s.heading))
  const changedSections = incomingSections.filter(s => {
    const existing = existingSections.find(e => e.heading === s.heading)
    return existing && existing.body !== s.body
  })

  if (newSections.length === 0 && changedSections.length === 0) {
    console.log(chalk.gray('  ~/.claude/CLAUDE.md: keine Aenderungen.'))
    return
  }

  console.log(chalk.yellow('\n=== Setup-Kit: Aenderungen in CLAUDE.md ==='))
  console.log(chalk.gray('Claude: Bitte diese Aenderungen intelligent in ~/.claude/CLAUDE.md'))
  console.log(chalk.gray('        integrieren. Bestehende Inhalte, Memories und eigene'))
  console.log(chalk.gray('        Anpassungen niemals loeschen oder ueberschreiben.\n'))

  if (newSections.length > 0) {
    console.log(chalk.cyan('NEUE SEKTIONEN (noch nicht vorhanden):'))
    for (const s of newSections) {
      console.log(chalk.green(`\n+ ${s.heading}`))
      console.log(chalk.gray(s.body.trimEnd()))
    }
  }

  if (changedSections.length > 0) {
    console.log(chalk.cyan('\nGEAENDERTE SEKTIONEN (Template aktualisiert):'))
    for (const s of changedSections) {
      const existing = existingSections.find(e => e.heading === s.heading)!
      console.log(chalk.yellow(`\n~ ${s.heading}`))
      console.log(chalk.gray('  Aktuell in deiner CLAUDE.md:'))
      existing.body.trimEnd().split('\n').forEach(l => console.log(chalk.gray(`    ${l}`)))
      console.log(chalk.white('  Neue Version im Template:'))
      s.body.trimEnd().split('\n').forEach(l => console.log(chalk.white(`    ${l}`)))
    }
  }

  console.log(chalk.yellow('\n=== Ende der Aenderungen ===\n'))
}

// ============================================================
// CONFIG (~/.claude/setup-kit.json)
// ============================================================

export interface SetupConfig {
  projectsBase?: string
  lastCommitHash?: string
  lastUpdateCheck?: string
  updateAvailable?: boolean
}

// ============================================================
// AUTO-UPDATE CHECK (stil im Hintergrund, alle 2 Tage)
// ============================================================

const UPDATE_INTERVAL_DAYS = 2

export async function checkForUpdatesInBackground(): Promise<void> {
  if (!fs.existsSync(SETUP_KIT_DIR)) return

  const config = loadConfig()
  const now = new Date()

  // Pruefen ob Check noetig (alle UPDATE_INTERVAL_DAYS Tage)
  if (config.lastUpdateCheck) {
    const lastCheck = new Date(config.lastUpdateCheck)
    const daysSince = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince < UPDATE_INTERVAL_DAYS) return
  }

  try {
    // Stilles fetch (kein Output)
    await execa('git', ['-C', SETUP_KIT_DIR, 'fetch', 'origin'], {
      stdio: 'pipe',
      timeout: 5000,
    })

    const { stdout: local } = await execa('git', ['-C', SETUP_KIT_DIR, 'rev-parse', 'HEAD'])
    const { stdout: remote } = await execa('git', ['-C', SETUP_KIT_DIR, 'rev-parse', 'origin/master'])

    const updateAvailable = local.trim() !== remote.trim()

    saveConfig({
      lastUpdateCheck: now.toISOString().slice(0, 10),
      lastCommitHash: local.trim(),
      updateAvailable,
    })

    if (updateAvailable) {
      console.log(chalk.yellow('\n  Update verfuegbar! Ausfuehren mit: setup-kit update\n'))
    }
  } catch {
    // Netzwerkfehler still ignorieren — kein Output, kein Absturz
  }
}

export function loadConfig(): SetupConfig {
  if (!fs.existsSync(CONFIG_FILE)) return {}
  try {
    return fs.readJsonSync(CONFIG_FILE) as SetupConfig
  } catch {
    return {}
  }
}

export function saveConfig(config: SetupConfig): void {
  fs.ensureDirSync(CLAUDE_DIR)
  const existing = loadConfig()
  fs.writeJsonSync(CONFIG_FILE, { ...existing, ...config }, { spaces: 2 })
}

export function getProjectsBase(): string {
  const config = loadConfig()
  if (config.projectsBase && fs.existsSync(config.projectsBase)) {
    return config.projectsBase
  }

  const candidates = [
    'C:\\coding', 'C:\\projects', 'C:\\dev', 'C:\\work',
    path.join(os.homedir(), 'projects'),
    path.join(os.homedir(), 'coding'),
    path.join(os.homedir(), 'dev'),
    'D:\\coding', 'D:\\projects',
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return os.homedir()
}

// ============================================================
// DATEI-UTILITIES
// ============================================================

export function replacePlaceholders(
  filePath: string,
  replacements: Record<string, string>
): void {
  if (!fs.existsSync(filePath)) return
  let content = fs.readFileSync(filePath, 'utf8')
  for (const [key, value] of Object.entries(replacements)) {
    content = content.replaceAll(key, value)
  }
  fs.writeFileSync(filePath, content, 'utf8')
}

export function fillProjectBrief(filePath: string, ctx: ProjectContext): void {
  if (!fs.existsSync(filePath)) return
  const features = ctx.features.split(',').map(f => f.trim()).filter(Boolean)
  replacePlaceholders(filePath, {
    '[BESCHREIBUNG]': ctx.description,
    '[ZIELGRUPPE]': ctx.audience,
    '[PROJEKTTYP]': ctx.kind,
    '[FEATURE-1]': features[0] ?? '',
    '[FEATURE-2]': features[1] ?? '',
    '[FEATURE-3]': features[2] ?? '',
  })
}

// ============================================================
// GIT
// ============================================================

export async function gitInit(projectPath: string, userName: string, version: string): Promise<void> {
  await execa('git', ['-C', projectPath, 'init', '-b', 'main'], { stdio: 'pipe' })
  await execa('git', ['-C', projectPath, 'add', '-A'], { stdio: 'pipe' })
  await execa('git', [
    '-C', projectPath,
    '-c', `user.name=${userName}`,
    '-c', 'user.email=setup@local',
    'commit', '-m', `chore: initial project setup [v${version}]`
  ], { stdio: 'pipe' })
}

export async function gitCommit(projectPath: string, userName: string, message: string): Promise<void> {
  await execa('git', ['-C', projectPath, 'add', '-A'], { stdio: 'pipe' })
  await execa('git', [
    '-C', projectPath,
    '-c', `user.name=${userName}`,
    '-c', 'user.email=setup@local',
    'commit', '-m', message
  ], { stdio: 'pipe' })
}

// ============================================================
// TYPEN
// ============================================================

export interface ProjectContext {
  description: string
  audience: string
  features: string
  kind: string
  hasUserData: boolean
  hasDatabase: boolean
  isPerf: boolean
}
