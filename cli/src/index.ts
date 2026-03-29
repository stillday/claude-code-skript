import { Command } from 'commander'
import chalk from 'chalk'
import { ensureSetupKit, updateSetupKit, checkForUpdatesInBackground } from './utils.js'
import { runWizard, checkPrerequisites } from './wizard.js'

const program = new Command()

program
  .name('setup-kit')
  .description('Claude Code Setup Kit - portables Projekt-Setup-Tool')
  .version('1.0.0')

// Standard: setup-kit (kein Subcommand) -> Wizard starten
program
  .action(async () => {
    await ensureSetupKit()
    // Non-blocking: Update-Check im Hintergrund, blockiert den Wizard nicht
    checkForUpdatesInBackground()
    await runWizard()
  })

// setup-kit update -> Setup-Kit-Repo aktualisieren
program
  .command('update')
  .description('Setup-Kit auf den neuesten Stand bringen')
  .action(async () => {
    await updateSetupKit()
  })

// setup-kit status -> Prereqs + Skills anzeigen
program
  .command('status')
  .description('Voraussetzungen und installierte Skills pruefen')
  .action(async () => {
    console.log(chalk.cyan('\n=== Setup-Kit Status ==='))
    await checkPrerequisites()
    console.log('')
  })

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(chalk.red('\nFehler:'), err instanceof Error ? err.message : String(err))
  process.exit(1)
})
