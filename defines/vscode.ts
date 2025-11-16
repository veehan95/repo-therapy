import { merge } from 'lodash'
import { RunCondition } from '../enums'
import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'

// todo with enum
interface Editor {
  'editor.defaultFormatter'?: string,
  'editor.codeActionsOnSave'?: {
    [s in `source.${string}`]: boolean
  }
  'editor.wordWrap': string
  'editor.quickSuggestions': boolean
  'editor.renderWhitespace': string
}

type FileFlag = Record<string, boolean>

type VSCodeSettingEditor = {
  'editor.fontSize': number
  'editor.fontFamily': string
  'editor.fontLigatures': boolean
  'editor.lineHeight': number
  'editor.tabSize': number
  'editor.insertSpaces': boolean
  'editor.detectIndentation': boolean
  'editor.wordWrap': string
  'editor.minimap.enabled': boolean
  'editor.renderWhitespace': string
  'editor.renderControlCharacters': boolean
  'editor.bracketPairColorization.enabled': boolean
  'editor.guides.bracketPairs': boolean
  'editor.cursorBlinking': string
  'editor.cursorSmoothCaretAnimation': string
  'editor.smoothScrolling': boolean
  'editor.formatOnSave': boolean
  'editor.formatOnPaste': boolean
  'editor.codeActionsOnSave': {
    'source.fixAll': RunCondition
    'source.organizeImports': RunCondition
    'source.fixAll.eslint': RunCondition
  }
  'editor.inlineSuggest.enabled': boolean
  'editor.accessibilitySupport': string
  'editor.linkedEditing': boolean
  'editor.occurrencesHighlight': boolean
  'editor.selectionHighlight': boolean
  'editor.suggestSelection': string
  'editor.acceptSuggestionOnCommitCharacter': boolean
  'editor.acceptSuggestionOnEnter': string
  'editor.hover.enabled': boolean
  'editor.folding': boolean
  'editor.foldingHighlight': boolean
  'editor.matchBrackets': string
  'editor.multiCursorModifier': string
}

type VSCodeSettingExplorer = {
  'explorer.compactFolders': boolean
  'explorer.confirmDelete': boolean
  'explorer.confirmDragAndDrop': boolean
  'explorer.openEditors.visible': number
}

type VSCodeSettingFile = {
  'files.autoSave': string
  'files.autoSaveDelay': number
  'files.exclude': FileFlag
  'files.insertFinalNewline': boolean
  'files.trimFinalNewlines': boolean
  'files.trimTrailingWhitespace': boolean
  'files.watcherExclude': FileFlag
}

type VSCodeSettingGit = {
  'git.autofetch': boolean
  'git.autofetchPeriod': number
  'git.confirmSync': boolean
  'git.enableSmartCommit': boolean
  'git.openRepositoryInParentFolders': string
}

type VSCodeSettingTelemetry = {
  'telemetry.telemetryLevel': string
  'terminal.integrated.cursorBlinking': boolean
  'terminal.integrated.cursorStyle': string
  'terminal.integrated.fontSize': number
  'terminal.integrated.shell.linux': string
  'terminal.integrated.shell.osx': string
  'terminal.integrated.shell.windows': string
}

type VSCodeSettingWindow = {
  'window.menuBarVisibility': string
  'window.title': string
  'window.zoomLevel': number
}

type VSCodeSettingWorkBench = {
  'workbench.activityBar.visible': boolean
  'workbench.colorTheme': string
  'workbench.editor.tabSizing': string
  'workbench.iconTheme': string
  'workbench.productIconTheme': string
  'workbench.sideBar.location': string
  'workbench.startupEditor': string
  'workbench.statusBar.visible': boolean
}

type VSCodeSettingOther = {
  'breadcrumbs.enabled': boolean
  'breadcrumbs.filePath': string
  'debug.console.fontSize': number
  'debug.internalConsoleOptions': string
  'diffEditor.ignoreTrimWhitespace': boolean
  'emmet.includeLanguages': Record<string, string>
  'emmet.triggerExpansionOnTab': boolean
  'eslint.validate': Array<string>
  'extensions.autoUpdate': boolean
  'extensions.ignoreRecommendations': boolean
  'keyboard.dispatch': string
  'search.exclude': FileFlag
  'security.workspace.trust.enabled': boolean
}

type VSCodeSettingLanguageSpecific = {
  [s in `[${string}]`]: Editor
}

type VSCodeSetting = VSCodeSettingEditor &
  VSCodeSettingExplorer &
  VSCodeSettingFile &
  VSCodeSettingGit &
  VSCodeSettingTelemetry &
  VSCodeSettingWindow &
  VSCodeSettingWorkBench &
  VSCodeSettingOther &
  VSCodeSettingLanguageSpecific

export interface VSCodeOptions {
  settings: VSCodeSetting
  extenstions: {
    vscodeTypescriptNext: boolean | 'unwanted'
    prettierVscode: boolean | 'unwanted'
    gitlens: boolean | 'unwanted'
    vscodeEslint: boolean | 'unwanted'
    rainbowCsv: boolean | 'unwanted'
    recommendations: Array<string>
    unwantedRecommendations: Array<string>
  }
}

export function defineRepoTherapyVsCode (
  options: Partial<VSCodeOptions> = {}
) {
  return wrapper('vscode', (libTool) => {
    async function getSettings (): Promise<VSCodeSetting> {
      const exclude = Object.fromEntries(
        await libTool
          .gitignore()
          .getAsArray()
          .then(s => s.map(x => [x, true]))
      )
      return merge({
        'editor.tabSize': 2,
        'editor.trimAutoWhitespace': true,
        'eslint.enable': true,
        'eslint.format.enable': true,
        'editor.codeActionsOnSave': {
          'source.fixAll': RunCondition.on,
          'source.organizeImports': RunCondition.on,
          'source.fixAll.eslint': RunCondition.on
        },
        'editor.formatOnSave': true,
        'editor.defaultFormatter': 'esbenp.prettier-vscode',
        'files.eol': '\n',
        'files.exclude': {
          ...exclude,
          [libTool.path.build.replace(/^\//, '')]: false
        },
        'files.watcherExclude': exclude
      }, options.settings)
    }

    function getExtensions () {
      const recommendations = options.extenstions?.recommendations || []
      const unwantedRecommendations = options.extenstions
        ?.unwantedRecommendations || []

      if (options.extenstions?.vscodeTypescriptNext === 'unwanted') {
        unwantedRecommendations.push('ms-vscode.vscode-typescript-next')
      } else if (options.extenstions?.vscodeTypescriptNext !== false) {
        recommendations.push('ms-vscode.vscode-typescript-next')
      }
      if (options.extenstions?.prettierVscode === 'unwanted') {
        unwantedRecommendations.push('esbenp.prettier-vscode')
      } else if (options.extenstions?.prettierVscode !== false) {
        recommendations.push('esbenp.prettier-vscode')
      }
      if (options.extenstions?.gitlens === 'unwanted') {
        unwantedRecommendations.push('eamodio.gitlens')
      } else if (options.extenstions?.gitlens !== false) {
        recommendations.push('eamodio.gitlens')
      }
      if (options.extenstions?.vscodeEslint === 'unwanted') {
        unwantedRecommendations.push('dbaeumer.vscode-eslint')
      } else if (options.extenstions?.vscodeEslint !== false) {
        recommendations.push('dbaeumer.vscode-eslint')
      }
      if (options.extenstions?.rainbowCsv === 'unwanted') {
        unwantedRecommendations.push('mechatroner.rainbow-csv')
      } else if (options.extenstions?.rainbowCsv !== false) {
        recommendations.push('mechatroner.rainbow-csv')
      }

      return {
        recommendations,
        unwantedRecommendations
      }
    }

    async function get () {
      return {
        settings: await getSettings(),
        extensions: getExtensions()
      }
    }

    return {
      get,
      generate: async () => {
        const { settings, extensions } = await get()
        return [
          await libTool.importLib.writeStatic(
            '/.vscode/settings.json',
            () => JSON.stringify(settings, undefined, 2),
            { overwrite: true }
          ),
          await libTool.importLib.writeStatic(
            '/.vscode/extensions.json',
            () => JSON.stringify(extensions, undefined, 2),
            { overwrite: true }
          )
        ]
      }
    }
  })
}
