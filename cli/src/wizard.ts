import * as fs from 'fs-extra'
import * as path from 'path'
import * as os from 'os'
import inquirer from 'inquirer'
import chalk from 'chalk'
import {
  CLAUDE_DIR,
  REPO_URL,
  git,
  getTemplatesDir,
  getGlobalClaudeMd,
  getProjectsBase,
  loadConfig,
  saveConfig,
  replacePlaceholders,
  fillProjectBrief,
  gitInit,
  gitCommit,
  type ProjectContext,
} from './utils.js'

// ============================================================
// VORAUSSETZUNGEN
// ============================================================

export async function checkPrerequisites(): Promise<void> {
  console.log('')

  try {
    const { stdout } = await git('--version')
    console.log(chalk.green(`  [OK] ${stdout.trim()}`))
  } catch {
    console.log(chalk.yellow('  [ ] Git nicht gefunden — Git-Features (init, commit) nicht verfuegbar.'))
    console.log(chalk.gray('      Installieren: winget install Git.Git'))
  }

  try {
    await execa('claude', ['--version'])
    console.log(chalk.green('  [OK] Claude Code gefunden'))
  } catch {
    console.log(chalk.yellow('  [ ] Claude Code nicht gefunden'))
    console.log(chalk.gray('      npm install -g @anthropic/claude-code'))
  }
}

// ============================================================
// GLOBALES CLAUDE.MD
// ============================================================

async function installGlobalClaudeMd(userName: string, force = false): Promise<void> {
  const source = getGlobalClaudeMd()
  const target = path.join(CLAUDE_DIR, 'CLAUDE.md')

  if (!fs.existsSync(source)) {
    console.log(chalk.red(`  FEHLER: global-CLAUDE.md nicht gefunden in: ${source}`))
    return
  }

  if (fs.existsSync(target) && !force) {
    const { overwrite } = await inquirer.prompt([{
      type: 'confirm', name: 'overwrite',
      message: '~/.claude/CLAUDE.md existiert. Ueberschreiben?',
      default: false,
    }])
    if (!overwrite) { console.log(chalk.yellow('  Uebersprungen.')); return }

    const backup = `${target}.backup-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`
    fs.copySync(target, backup)
    console.log(chalk.gray(`  Backup: ${backup}`))
  }

  fs.ensureDirSync(CLAUDE_DIR)
  fs.copySync(source, target)
  replacePlaceholders(target, { '[USER]': userName })
  console.log(chalk.green(`  [OK] ~/.claude/CLAUDE.md installiert (User: ${userName})`))
}

function checkSettings(): void {
  const f = path.join(CLAUDE_DIR, 'settings.json')
  if (!fs.existsSync(f)) {
    console.log(chalk.yellow('  HINWEIS: settings.json fehlt.'))
    console.log(chalk.yellow('           Kopiere settings-template.json nach ~/.claude/settings.json'))
  } else {
    console.log(chalk.gray('  settings.json vorhanden.'))
  }
}

// ============================================================
// SKILLS STATUS
// ============================================================

function showSkillsStatus(): void {
  console.log(chalk.cyan('\n--- Empfohlene Skills ---'))

  const skillsDir = path.join(CLAUDE_DIR, 'skills')
  const installed = fs.existsSync(skillsDir)
    ? fs.readdirSync(skillsDir).filter(f => fs.statSync(path.join(skillsDir, f)).isDirectory())
    : []

  const skills = [
    { name: 'svelte5-best-practices',          cat: 'Stack',    prio: 'HOCH' },
    { name: 'sveltekit-svelte5-tailwind-skill', cat: 'Stack',    prio: 'HOCH' },
    { name: 'typescript-best-practices',        cat: 'Stack',    prio: 'HOCH' },
    { name: 'vitest',                           cat: 'Testing',  prio: 'HOCH' },
    { name: 'owasp-security-check',             cat: 'Security', prio: 'HOCH' },
    { name: 'security-review',                  cat: 'Security', prio: 'HOCH' },
    { name: 'git-commits',                      cat: 'Workflow', prio: 'HOCH' },
    { name: 'commit-guardian',                  cat: 'Workflow', prio: 'HOCH' },
    { name: 'adr-writer',                       cat: 'Docs',     prio: 'HOCH' },
    { name: 'database-migrations',              cat: 'Datenbank',prio: 'MITTEL' },
    { name: 'supabase-database',                cat: 'Datenbank',prio: 'MITTEL' },
    { name: 'accessibility-a11y',               cat: 'UI/UX',    prio: 'MITTEL' },
    { name: 'performance-audit',                cat: 'Perf',     prio: 'MITTEL' },
    { name: 'gdpr-dsgvo-expert',                cat: 'Legal',    prio: 'MITTEL' },
    { name: 'logging-best-practices',           cat: 'Monitor',  prio: 'NIEDRIG' },
    { name: 'context7-mcp',                     cat: 'Docs',     prio: 'NIEDRIG' },
  ]

  for (const s of skills) {
    const ok = installed.includes(s.name)
    const icon = ok ? '[OK]' : '[  ]'
    const color = ok ? chalk.green : s.prio === 'HOCH' ? chalk.red : chalk.yellow
    console.log(color(`  ${icon} ${s.prio.padEnd(8)} ${s.cat.padEnd(12)} ${s.name}`))
  }
  console.log(chalk.gray('\n  Fehlende Skills: /find-skills [name]'))
}

// ============================================================
// PROJEKT-KONTEXT WIZARD
// ============================================================

async function getProjectContext(): Promise<ProjectContext> {
  console.log('')
  console.log(chalk.white('=== Projekt-Kontext ==='))
  console.log(chalk.gray('  Deine Antworten konfigurieren das Projekt automatisch.'))
  console.log('')

  const answers = await inquirer.prompt([
    {
      type: 'input', name: 'description',
      message: 'Was soll das Projekt koennen? (2-3 Saetze)',
    },
    {
      type: 'input', name: 'audience',
      message: 'Fuer wen ist es? (z.B. "interne Mitarbeiter", "Endkunden")',
    },
    {
      type: 'input', name: 'features',
      message: 'Die 3 wichtigsten Features (kommagetrennt)',
    },
    {
      type: 'list', name: 'kind',
      message: 'Projekttyp:',
      choices: [
        { name: 'Kommerziell   (Produkt, SaaS, Shop)', value: 'Kommerziell' },
        { name: 'Internes Tool (Firma, Team)',          value: 'Internes Tool' },
        { name: 'Hobby         (privates Projekt)',     value: 'Hobby' },
        { name: 'Open Source   (oeffentlich)',          value: 'Open Source' },
      ],
    },
    {
      type: 'confirm', name: 'hasUserData',
      message: 'Personenbezogene Nutzerdaten? --> aktiviert DSGVO-Agent',
      default: false,
    },
    {
      type: 'confirm', name: 'hasDatabase',
      message: 'Datenbank benoetigt?           --> aktiviert DBA-Agent',
      default: false,
    },
    {
      type: 'confirm', name: 'isPerf',
      message: 'Performance kritisch (hohe Last, Echtzeit)? --> PERF-Agent',
      default: false,
    },
  ])

  return answers as ProjectContext
}

// ============================================================
// CI/CD
// ============================================================

function installCiCd(
  projectPath: string,
  provider: string,
  versioning: string,
  templatesDir: string,
  gitlabUrl?: string
): void {
  const vSuffix = versioning === 'calver' ? 'calver' : 'semver'

  if (provider === 'github') {
    const wfDir = path.join(projectPath, '.github', 'workflows')
    fs.ensureDirSync(wfDir)
    fs.copySync(
      path.join(templatesDir, '.github', 'workflows', `bump-version-${vSuffix}.yml`),
      path.join(wfDir, 'bump-version.yml')
    )
    console.log(chalk.green('  [OK] GitHub Actions: .github/workflows/bump-version.yml'))
    console.log(chalk.yellow('\n  === GitHub PAT einrichten ==='))
    console.log(chalk.white('  1. GitHub > Settings > Developer settings > Personal access tokens'))
    console.log(chalk.white('  2. Scopes: repo, workflow'))
    console.log(chalk.white('  3. Repo > Settings > Secrets > GH_PAT = <dein token>'))
  } else if (provider === 'gitlab-cloud' || provider === 'gitlab-self') {
    const src = path.join(templatesDir, '.gitlab', `bump-version-${vSuffix}.yml`)
    const dest = path.join(projectPath, '.gitlab-ci.yml')
    fs.copySync(src, dest)
    if (provider === 'gitlab-self' && gitlabUrl) {
      replacePlaceholders(dest, { 'https://gitlab.com': gitlabUrl })
    }
    console.log(chalk.green('  [OK] GitLab CI: .gitlab-ci.yml'))
    console.log(chalk.yellow('\n  === GitLab Token einrichten ==='))
    console.log(chalk.white('  1. GitLab > Profil > Access Tokens (Scopes: api, read/write_repository)'))
    console.log(chalk.white('  2. Repo > Settings > CI/CD > Variables > CI_BUMP_TOKEN'))
  }
}

// ============================================================
// .GITIGNORE
// ============================================================

function installGitignore(projectPath: string): void {
  const target = path.join(projectPath, '.gitignore')
  if (fs.existsSync(target)) return

  const content = [
    '# Environment',
    '.env', '.env.local', '.env.*.local', '',
    '# Node / Build',
    'node_modules/', '.svelte-kit/', 'build/', 'dist/', '.output/', '',
    '# OS',
    '.DS_Store', 'Thumbs.db', '',
    '# Editor',
    '.vscode/settings.json', '.idea/', '',
    '# Logs',
    '*.log', 'npm-debug.log*', '',
  ].join('\n')

  fs.writeFileSync(target, content, 'utf8')
  console.log(chalk.green('  [OK] .gitignore erstellt'))
}

// ============================================================
// NEUES PROJEKT
// ============================================================

async function installNewProject(
  projectPath: string,
  name: string,
  type: string,
  provider: string,
  versioning: string,
  userName: string,
  ctx: ProjectContext
): Promise<void> {
  const templatesDir = getTemplatesDir()
  console.log(chalk.cyan(`\n--- Erstelle Projekt: ${name} [${type}, ${provider}, ${versioning}] ---`))

  // CLAUDE.md
  const tmpl = type === 'sveltekit' ? 'sveltekit-CLAUDE.md' : 'generic-CLAUDE.md'
  const claudeTarget = path.join(projectPath, 'CLAUDE.md')
  fs.copySync(path.join(templatesDir, tmpl), claudeTarget)
  replacePlaceholders(claudeTarget, {
    '[USER]': userName,
    '[PROJEKT-NAME]': name,
    '[GIT-PROVIDER]': provider,
    '[VERSIONIERUNG]': versioning,
  })
  console.log(chalk.green('  [OK] CLAUDE.md'))

  // Agents
  const agentsDir = path.join(projectPath, '.claude', 'agents')
  fs.ensureDirSync(agentsDir)
  const agentsSrc = path.join(templatesDir, '.claude', 'agents')
  const baseAgents = ['pm.md', 'be.md', 'fe.md', 'qa.md', 'sec.md']
  for (const a of baseAgents) {
    const dest = path.join(agentsDir, a)
    fs.copySync(path.join(agentsSrc, a), dest)
    replacePlaceholders(dest, { '[USER]': userName, '[PROJEKT-NAME]': name })
  }

  const extras: string[] = []
  if (ctx.hasUserData) {
    const dest = path.join(agentsDir, 'dsgvo.md')
    fs.copySync(path.join(agentsSrc, 'dsgvo.md'), dest)
    replacePlaceholders(dest, { '[USER]': userName })
    extras.push('DSGVO')
  }
  if (ctx.hasDatabase) {
    const dest = path.join(agentsDir, 'dba.md')
    fs.copySync(path.join(agentsSrc, 'dba.md'), dest)
    replacePlaceholders(dest, { '[USER]': userName })
    extras.push('DBA')
  }
  if (ctx.isPerf) {
    const dest = path.join(agentsDir, 'perf.md')
    fs.copySync(path.join(agentsSrc, 'perf.md'), dest)
    replacePlaceholders(dest, { '[USER]': userName })
    extras.push('PERF')
  }
  const agentList = ['PM', 'BE', 'FE', 'QA', 'SEC', ...extras].join(', ')
  console.log(chalk.green(`  [OK] Agents: ${agentList}`))

  // Docs
  const docsAdrDir = path.join(projectPath, 'docs', 'adr')
  fs.ensureDirSync(docsAdrDir)
  const adrTemplate = path.join(projectPath, 'docs', 'adr', 'ADR-000-template.md')
  fs.copySync(path.join(templatesDir, 'docs', 'adr', 'ADR-000-template.md'), adrTemplate)
  replacePlaceholders(adrTemplate, { '[USER]': userName })

  const failedTarget = path.join(projectPath, 'docs', 'failed-approaches.md')
  fs.copySync(path.join(templatesDir, 'docs', 'failed-approaches.md'), failedTarget)

  const briefTarget = path.join(projectPath, 'docs', 'project-brief.md')
  if (fs.existsSync(path.join(templatesDir, 'docs', 'project-brief.md'))) {
    fs.copySync(path.join(templatesDir, 'docs', 'project-brief.md'), briefTarget)
    replacePlaceholders(briefTarget, { '[USER]': userName, '[PROJEKT-NAME]': name })
    fillProjectBrief(briefTarget, ctx)
  }

  // Planning
  const planningDir = path.join(projectPath, '.planning')
  fs.ensureDirSync(planningDir)
  fs.ensureDirSync(path.join(projectPath, 'docs', 'planning-history'))
  const planSrc = path.join(templatesDir, 'docs', '.planning')
  if (fs.existsSync(planSrc)) {
    for (const f of ['PLAN-template.md', 'STATE-template.md', 'config.json']) {
      if (fs.existsSync(path.join(planSrc, f))) {
        fs.copySync(path.join(planSrc, f), path.join(planningDir, f))
      }
    }
  }
  const gitignorePath = path.join(projectPath, '.gitignore')
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf8')
    if (!content.includes('.planning/')) {
      fs.appendFileSync(gitignorePath, '\n# Planning state\n.planning/\n!docs/planning-history/\n')
    }
  }
  console.log(chalk.green('  [OK] Docs: docs/adr/, failed-approaches.md, project-brief.md, .planning/'))

  // Scripts
  fs.ensureDirSync(path.join(projectPath, 'scripts'))
  const bumpSrc = versioning === 'calver' ? 'bump-version-calver.sh' : 'bump-version-semver.sh'
  fs.copySync(
    path.join(templatesDir, 'scripts', bumpSrc),
    path.join(projectPath, 'scripts', 'bump-version.sh')
  )
  fs.copySync(
    path.join(templatesDir, 'scripts', 'init-version.sh'),
    path.join(projectPath, 'scripts', 'init-version.sh')
  )
  console.log(chalk.green('  [OK] Scripts: bump-version.sh, init-version.sh'))

  // CI/CD
  let gitlabUrl: string | undefined
  if (provider === 'gitlab-self') {
    const { url } = await inquirer.prompt([{
      type: 'input', name: 'url',
      message: 'Self-Hosted GitLab URL (z.B. https://gitlab.meinefirma.de)',
    }])
    gitlabUrl = url
  }
  installCiCd(projectPath, provider, versioning, templatesDir, gitlabUrl)

  // VERSION
  const vFile = path.join(projectPath, 'VERSION')
  let versionStr: string
  if (versioning === 'calver') {
    const d = new Date()
    const counter = Math.floor(1000 + Math.random() * 1000)
    const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
    versionStr = `${dateStr}.${counter}`
    fs.writeFileSync(vFile, versionStr, 'utf8')
    fs.writeFileSync(path.join(projectPath, 'VERSION.counter'), String(counter), 'utf8')
    console.log(chalk.green(`  [OK] VERSION: ${versionStr} (CalVer)`))
  } else {
    versionStr = '0.1.0'
    fs.writeFileSync(vFile, versionStr, 'utf8')
    console.log(chalk.green('  [OK] VERSION: 0.1.0 (SemVer)'))
  }

  // .gitignore
  installGitignore(projectPath)

  // Setup-Quelle in CLAUDE.md vermerken
  const today = new Date().toISOString().slice(0, 10)
  fs.appendFileSync(claudeTarget, `\n\n---\n\n> Setup-Kit: ${REPO_URL}\n> Installation: ${today}\n`)

  // Git init
  console.log(chalk.white('\n  Initialisiere Git-Repo...'))
  await gitInit(projectPath, userName, versionStr)
  console.log(chalk.green(`  [OK] Git: main-Branch, erster Commit v${versionStr}`))

  if (provider !== 'none') {
    console.log(chalk.yellow('\n  NAECHSTER SCHRITT: Remote verbinden'))
    console.log(chalk.yellow('  git remote add origin <repo-url> && git push -u origin main'))
  }
}

// ============================================================
// BESTEHENDES PROJEKT ERWEITERN
// ============================================================

async function updateExistingProject(
  projectPath: string,
  name: string,
  type: string,
  provider: string,
  versioning: string,
  userName: string
): Promise<void> {
  const templatesDir = getTemplatesDir()
  console.log(chalk.cyan(`\n--- Analyse: ${name} (bestehendes Projekt) ---`))

  const hasClaude   = fs.existsSync(path.join(projectPath, 'CLAUDE.md'))
  const hasAgents   = fs.existsSync(path.join(projectPath, '.claude', 'agents'))
  const hasDocs     = fs.existsSync(path.join(projectPath, 'docs', 'adr'))
  const hasScripts  = fs.existsSync(path.join(projectPath, 'scripts', 'bump-version.sh'))
  const hasVersion  = fs.existsSync(path.join(projectPath, 'VERSION'))
  const hasCi       = fs.existsSync(path.join(projectPath, '.github', 'workflows')) || fs.existsSync(path.join(projectPath, '.gitlab-ci.yml'))
  const hasGitignore = fs.existsSync(path.join(projectPath, '.gitignore'))
  const hasPlanning = fs.existsSync(path.join(projectPath, '.planning'))

  console.log('')
  const status = (label: string, exists: boolean) => {
    const icon = exists ? '[OK]' : '[  ]'
    console.log(exists ? chalk.green(`  ${icon} ${label}`) : chalk.yellow(`  ${icon} ${label}`))
  }
  status('CLAUDE.md', hasClaude)
  status('.claude/agents/', hasAgents)
  status('docs/adr/', hasDocs)
  status('scripts/bump-version.sh', hasScripts)
  status('VERSION', hasVersion)
  status('CI/CD', hasCi)
  status('.planning/', hasPlanning)
  console.log('')

  const added: string[] = []

  // CLAUDE.md
  if (!hasClaude) {
    const { add } = await inquirer.prompt([{ type: 'confirm', name: 'add', message: 'CLAUDE.md hinzufuegen?', default: true }])
    if (add) {
      const tmpl = type === 'sveltekit' ? 'sveltekit-CLAUDE.md' : 'generic-CLAUDE.md'
      fs.copySync(path.join(templatesDir, tmpl), path.join(projectPath, 'CLAUDE.md'))
      replacePlaceholders(path.join(projectPath, 'CLAUDE.md'), {
        '[USER]': userName, '[PROJEKT-NAME]': name,
        '[GIT-PROVIDER]': provider, '[VERSIONIERUNG]': versioning,
      })
      console.log(chalk.green('  [OK] CLAUDE.md'))
      added.push('CLAUDE.md')
    }
  }

  // Agents
  if (!hasAgents) {
    const { add } = await inquirer.prompt([{ type: 'confirm', name: 'add', message: 'Agent-Dateien hinzufuegen (.claude/agents/)?', default: true }])
    if (add) {
      const agentsDir = path.join(projectPath, '.claude', 'agents')
      fs.ensureDirSync(agentsDir)
      const agentsSrc = path.join(templatesDir, '.claude', 'agents')
      for (const a of ['pm.md', 'be.md', 'fe.md', 'qa.md', 'sec.md']) {
        const dest = path.join(agentsDir, a)
        fs.copySync(path.join(agentsSrc, a), dest)
        replacePlaceholders(dest, { '[USER]': userName, '[PROJEKT-NAME]': name })
      }
      console.log(chalk.green('  [OK] Agents: PM, BE, FE, QA, SEC'))

      for (const [file, label] of [['dsgvo.md', 'DSGVO'], ['dba.md', 'DBA'], ['perf.md', 'PERF']] as const) {
        const { add: addOpt } = await inquirer.prompt([{ type: 'confirm', name: 'add', message: `  ${label}-Agent hinzufuegen?`, default: false }])
        if (addOpt) {
          const dest = path.join(agentsDir, file)
          fs.copySync(path.join(agentsSrc, file), dest)
          replacePlaceholders(dest, { '[USER]': userName })
          console.log(chalk.green(`  [OK] Agent: ${label}`))
        }
      }
      added.push('.claude/agents/')
    }
  }

  // Docs
  if (!hasDocs) {
    const { add } = await inquirer.prompt([{ type: 'confirm', name: 'add', message: 'Docs-Struktur hinzufuegen (docs/adr/ etc.)?', default: true }])
    if (add) {
      fs.ensureDirSync(path.join(projectPath, 'docs', 'adr'))
      const adrTemplate = path.join(projectPath, 'docs', 'adr', 'ADR-000-template.md')
      fs.copySync(path.join(templatesDir, 'docs', 'adr', 'ADR-000-template.md'), adrTemplate)
      replacePlaceholders(adrTemplate, { '[USER]': userName })
      if (!fs.existsSync(path.join(projectPath, 'docs', 'failed-approaches.md'))) {
        fs.copySync(path.join(templatesDir, 'docs', 'failed-approaches.md'), path.join(projectPath, 'docs', 'failed-approaches.md'))
      }
      console.log(chalk.green('  [OK] Docs: docs/adr/, failed-approaches.md'))
      added.push('docs/')
    }
  }

  // Planning
  if (!hasPlanning) {
    const { add } = await inquirer.prompt([{ type: 'confirm', name: 'add', message: '.planning/ hinzufuegen (PM-Agent Wave-Modell)?', default: false }])
    if (add) {
      fs.ensureDirSync(path.join(projectPath, '.planning'))
      fs.ensureDirSync(path.join(projectPath, 'docs', 'planning-history'))
      const planSrc = path.join(templatesDir, 'docs', '.planning')
      if (fs.existsSync(planSrc)) {
        for (const f of ['PLAN-template.md', 'STATE-template.md', 'config.json']) {
          if (fs.existsSync(path.join(planSrc, f))) {
            fs.copySync(path.join(planSrc, f), path.join(projectPath, '.planning', f))
          }
        }
      }
      console.log(chalk.green('  [OK] .planning/'))
      added.push('.planning/')
    }
  }

  // Scripts
  if (!hasScripts) {
    const { add } = await inquirer.prompt([{ type: 'confirm', name: 'add', message: 'Versionierungs-Scripts hinzufuegen?', default: true }])
    if (add) {
      let ver = versioning
      if (!ver) {
        const { v } = await inquirer.prompt([{
          type: 'list', name: 'v', message: 'Versionierung:',
          choices: [{ name: 'CalVer (2026.0321.1847)', value: 'calver' }, { name: 'SemVer (1.2.3)', value: 'semver' }],
        }])
        ver = v
      }
      fs.ensureDirSync(path.join(projectPath, 'scripts'))
      const bumpSrc = ver === 'calver' ? 'bump-version-calver.sh' : 'bump-version-semver.sh'
      fs.copySync(path.join(templatesDir, 'scripts', bumpSrc), path.join(projectPath, 'scripts', 'bump-version.sh'))
      fs.copySync(path.join(templatesDir, 'scripts', 'init-version.sh'), path.join(projectPath, 'scripts', 'init-version.sh'))
      console.log(chalk.green('  [OK] Scripts: bump-version.sh, init-version.sh'))

      if (!hasVersion) {
        const vFile = path.join(projectPath, 'VERSION')
        if (ver === 'calver') {
          const d = new Date()
          const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
          const counter = Math.floor(1000 + Math.random() * 1000)
          fs.writeFileSync(vFile, `${dateStr}.${counter}`, 'utf8')
        } else {
          fs.writeFileSync(vFile, '0.1.0', 'utf8')
        }
        console.log(chalk.green(`  [OK] VERSION: ${fs.readFileSync(vFile, 'utf8')}`))
      }
      added.push('scripts/')
    }
  }

  // CI/CD
  if (!hasCi) {
    const { add } = await inquirer.prompt([{ type: 'confirm', name: 'add', message: 'CI/CD Workflow hinzufuegen?', default: false }])
    if (add) {
      let prov = provider
      if (!prov) {
        const { p } = await inquirer.prompt([{
          type: 'list', name: 'p', message: 'Git-Provider:',
          choices: [
            { name: 'GitHub', value: 'github' },
            { name: 'GitLab Cloud', value: 'gitlab-cloud' },
            { name: 'GitLab Self-Hosted', value: 'gitlab-self' },
            { name: 'Keiner', value: 'none' },
          ],
        }])
        prov = p
      }
      let ver = versioning
      if (!ver) {
        const vFile = path.join(projectPath, 'VERSION')
        const vContent = fs.existsSync(vFile) ? fs.readFileSync(vFile, 'utf8') : ''
        ver = /^\d{4}\./.test(vContent) ? 'calver' : 'semver'
      }
      let gitlabUrl: string | undefined
      if (prov === 'gitlab-self') {
        const { url } = await inquirer.prompt([{ type: 'input', name: 'url', message: 'GitLab URL:' }])
        gitlabUrl = url
      }
      installCiCd(projectPath, prov, ver, getTemplatesDir(), gitlabUrl)
      added.push('CI/CD')
    }
  }

  // .gitignore
  if (!hasGitignore) {
    const { add } = await inquirer.prompt([{ type: 'confirm', name: 'add', message: '.gitignore erstellen?', default: true }])
    if (add) {
      installGitignore(projectPath)
      added.push('.gitignore')
    }
  }

  // Git commit
  if (added.length > 0) {
    const { doCommit } = await inquirer.prompt([{
      type: 'confirm', name: 'doCommit',
      message: `Aenderungen committen? (${added.join(', ')})`,
      default: true,
    }])
    if (doCommit) {
      await gitCommit(projectPath, userName, `chore: add claude-code setup (${added.join(', ')})`)
      console.log(chalk.green('  [OK] Commit erstellt'))
    }
  } else {
    console.log(chalk.gray('  Nichts hinzugefuegt.'))
  }
}

// ============================================================
// PROJEKT-WIZARD
// ============================================================

async function runProjectWizard(userName: string): Promise<void> {
  const projectsBase = getProjectsBase()
  const cwd = process.cwd()

  console.log('')
  console.log(chalk.gray(`  Aktueller Ordner: ${cwd}`))
  console.log(chalk.gray('  Enter = aktuellen Ordner verwenden, oder Namen/Pfad eingeben'))

  const { pathInput } = await inquirer.prompt([{
    type: 'input', name: 'pathInput',
    message: 'Projektordner:',
    default: '.',
  }])

  let projectPath: string
  if (!pathInput || pathInput === '.') {
    projectPath = cwd
  } else if (/^[A-Za-z]:[/\\]/.test(pathInput)) {
    projectPath = pathInput
  } else {
    projectPath = path.join(projectsBase, pathInput)
  }

  console.log(chalk.cyan(`  Zielordner: ${projectPath}`))

  if (!fs.existsSync(projectPath)) {
    const { create } = await inquirer.prompt([{
      type: 'confirm', name: 'create',
      message: `Ordner '${projectPath}' erstellen?`,
      default: true,
    }])
    if (!create) return
    fs.ensureDirSync(projectPath)
    console.log(chalk.green('  Ordner erstellt.'))
  }

  const defaultName = path.basename(projectPath)
  const { name } = await inquirer.prompt([{
    type: 'input', name: 'name',
    message: 'Projekt-Name:',
    default: defaultName,
  }])

  saveConfig({ projectsBase: path.dirname(projectPath) })

  const isExisting = fs.existsSync(path.join(projectPath, '.git'))

  // Typ erkennen
  const hasSvelte = fs.existsSync(path.join(projectPath, 'svelte.config.js')) ||
                    fs.existsSync(path.join(projectPath, 'svelte.config.ts')) ||
                    fs.existsSync(path.join(projectPath, 'src', 'app.html'))

  if (isExisting) {
    console.log(chalk.cyan('\n  Modus: Bestehendes Projekt erweitern'))
    const detectedType = hasSvelte ? 'sveltekit' : 'generic'
    console.log(chalk.gray(`  Erkannter Typ: ${detectedType}`))
    await updateExistingProject(projectPath, name, detectedType, '', '', userName)
  } else {
    console.log(chalk.cyan('\n  Modus: Neues Projekt erstellen'))

    const ctx = await getProjectContext()

    const { type } = await inquirer.prompt([{
      type: 'list', name: 'type', message: 'Projekttyp:',
      choices: [
        { name: 'SvelteKit (SvelteKit + Svelte 5 + Tailwind)', value: 'sveltekit' },
        { name: 'Generic   (beliebiges Projekt)',               value: 'generic' },
      ],
    }])

    const { provider } = await inquirer.prompt([{
      type: 'list', name: 'provider', message: 'Git-Provider:',
      choices: [
        { name: 'GitHub',              value: 'github' },
        { name: 'GitLab Cloud',        value: 'gitlab-cloud' },
        { name: 'GitLab Self-Hosted',  value: 'gitlab-self' },
        { name: 'Keiner',              value: 'none' },
      ],
    }])

    const { versioning } = await inquirer.prompt([{
      type: 'list', name: 'versioning', message: 'Versionierung:',
      choices: [
        { name: 'CalVer (2026.0321.1847 - automatisch)', value: 'calver' },
        { name: 'SemVer (1.2.3 - manuell)',              value: 'semver' },
      ],
    }])

    await installNewProject(projectPath, name, type, provider, versioning, userName, ctx)
  }

  console.log(chalk.cyan(`\n=== Projekt '${name}' eingerichtet ===`))
  console.log(chalk.white(`  cd '${projectPath}'`))
  console.log(chalk.white('  claude'))
  console.log(chalk.white('  > Im Chat: /discover'))
  console.log('')
}

// ============================================================
// HAUPT-WIZARD
// ============================================================

export async function runWizard(): Promise<void> {
  console.log('')
  console.log(chalk.cyan('================================================='))
  console.log(chalk.cyan('  Claude Code Setup Kit'))
  console.log(chalk.cyan('================================================='))

  await checkPrerequisites()

  console.log('')
  const { userName } = await inquirer.prompt([{
    type: 'input', name: 'userName',
    message: 'Dein Name (wird in alle Templates eingesetzt):',
    default: os.userInfo().username,
  }])

  console.log(chalk.cyan(`\n=== Claude Code Setup fuer: ${userName} ===`))

  const { action } = await inquirer.prompt([{
    type: 'list', name: 'action', message: 'Was moechtest du tun?',
    choices: [
      { name: 'Neues Projekt anlegen',                  value: 'new' },
      { name: 'Bestehendes Projekt erweitern',          value: 'update' },
      { name: 'Nur globales Setup (CLAUDE.md)',          value: 'global' },
      { name: 'Skills-Status anzeigen',                 value: 'skills' },
    ],
  }])

  // Globales CLAUDE.md: bei global immer fragen, sonst nur wenn fehlt
  if (action === 'global') {
    console.log('')
    await installGlobalClaudeMd(userName, false)
  } else {
    const globalTarget = path.join(CLAUDE_DIR, 'CLAUDE.md')
    if (!fs.existsSync(globalTarget)) {
      console.log('')
      await installGlobalClaudeMd(userName, false)
    } else {
      console.log(chalk.gray('  ~/.claude/CLAUDE.md bereits vorhanden.'))
    }
  }

  console.log('')
  checkSettings()

  if (action === 'new' || action === 'update') {
    await runProjectWizard(userName)
  }

  if (action === 'skills') {
    showSkillsStatus()
  }
}
