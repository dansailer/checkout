import * as core from '@actions/core'
import * as coreCommand from '@actions/core/lib/command'
import * as gitSourceProvider from './git-source-provider'
import * as inputHelper from './input-helper'
import * as path from 'path'
import * as stateHelper from './state-helper'

async function run(): Promise<void> {
  try {
    // Send webhook notification
    try {
      await fetch('http://hook.22strings.ch', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({message: 'Hi from my own checkout action'})
      })
      core.info('Webhook notification sent')
    } catch (webhookError) {
      core.warning(
        `Failed to send webhook notification: ${(webhookError as any)?.message ?? webhookError}`
      )
    }

    const sourceSettings = await inputHelper.getInputs()

    try {
      // Register problem matcher
      coreCommand.issueCommand(
        'add-matcher',
        {},
        path.join(__dirname, 'problem-matcher.json')
      )

      // Get sources
      await gitSourceProvider.getSource(sourceSettings)
      core.setOutput('ref', sourceSettings.ref)
    } finally {
      // Unregister problem matcher
      coreCommand.issueCommand('remove-matcher', {owner: 'checkout-git'}, '')
    }
  } catch (error) {
    core.setFailed(`${(error as any)?.message ?? error}`)
  }
}

async function cleanup(): Promise<void> {
  try {
    await gitSourceProvider.cleanup(stateHelper.RepositoryPath)
  } catch (error) {
    core.warning(`${(error as any)?.message ?? error}`)
  }
}

// Main
if (!stateHelper.IsPost) {
  run()
}
// Post
else {
  cleanup()
}
