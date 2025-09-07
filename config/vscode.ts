export function vscodeIgnoreConfig (gitignore: Array<string> = []) {
  return [
    '.git',
    '.gitlab',
    '.husky',
    '.npmignore',
    '.vscode',
    'package-lock.json',
    'yarn.lock',
    ...gitignore
  ].map(s => [s.replace(/\./g, '\\\\.'), { default: true, type: 'boolean' }])
}

export function settingConfig (
  gitignore: Array<string> = []
): RepoTherapyUtil.JsonDefination {
  const vscodeIgnore = vscodeIgnoreConfig(gitignore)
  return {
    'editor\\\\.tabSize': { default: 2, type: 'number' },
    'editor\\\\.trimAutoWhitespace': { default: true, type: 'boolean' },
    'eslint\\\\.enable': { default: true, type: 'boolean' },
    'eslint\\\\.format\\\\.enable': { default: true, type: 'boolean' },
    'editor\\\\.codeActionsOnSave.source\\\\.fixAll\\\\.eslint': {
      default: 'explicit'
    },
    'editor\\\\.formatOnSave': { default: true, type: 'boolean' },
    'editor\\\\.defaultFormatter': { default: 'esbenp.prettier-vscode' },
    'files\\\\.eol': { default: '\n' },
    ...Object.fromEntries(
      vscodeIgnore.map(([k, v]) => [`files\\\\.exclude.${k}`, v])
    ),
    ...Object.fromEntries(
      vscodeIgnore.map(([k, v]) => [`files\\\\.watcherExclude.${k}`, v])
    ),
    ...Object.fromEntries(
      vscodeIgnore.map(([k, v]) => [`files\\\\.exclude.${k}`, v])
    )
  }
}

export const extension: RepoTherapyUtil.JsonDefination = {
  recommendations: {
    default: ['dbaeumer.vscode-eslint', 'eamodio.gitlens'],
    type: 'Array<string>'
  }
}
