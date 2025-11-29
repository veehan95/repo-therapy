export enum RunCondition {
  off = 'never',
  on = 'always',
  explicit = 'explicit'
}

export enum GenerateStatus {
  noAction = 'no-action',
  created = 'created',
  updated = 'updated'
}

export enum NodeJavaScriptExt {
  js = '.js',
  cjs = '.cjs',
  mjs = '.mjs',
  jsx = '.jsx'
}

export enum NodeTypeScriptExt {
  ts = '.ts',
  cts = '.cts',
  mts = '.mts',
  tsx = '.tsx'
}

export enum NodeEnvOptions {
  local = 'local',
  dev = 'dev',
  development = 'development',
  preProduction = 'pre-production',
  production = 'production',
  staging = 'staging',
  test = 'test'
}

export enum ConsoleBackgroundColor {
  red = '\x1b[41m',
  yellow = '\x1b[43m',
  close = '\x1b[49m',
  magentaBright = '\x1b[105m'
}

export enum ConsoleFontColor {
  black = '\x1b[30m',
  red = '\x1b[31m',
  green = '\x1b[32m',
  yellow = '\x1b[33m',
  magenta = '\x1b[35m',
  cyan = '\x1b[36m',
  close = '\x1b[39m'
}

export enum ConsoleWrapper {
  singleLine = ' <serviceName> | ',
  chunk = ' <serviceName>\n'
}

export enum EmojiAndUnicode {
  sparkles = '✨',
  i = '\u2139',
  tick = '\u2714',
  cross = '\u2717',
  circle = '\u2B58'
}

export enum ConsolePrefix {
  unknown = ConsoleBackgroundColor.magentaBright +
    ' UNKNOWN ' +
    ConsoleBackgroundColor.close +
    ConsoleWrapper.singleLine,
  error = ConsoleBackgroundColor.red +
    ' Error ' +
    ConsoleBackgroundColor.close +
    ConsoleWrapper.chunk,
  warn = `${ConsoleBackgroundColor.yellow}${ConsoleFontColor.black}` +
    ' WARN ' +
    `${ConsoleFontColor.close}${ConsoleBackgroundColor.close}` +
    ConsoleWrapper.chunk,
  info = ConsoleFontColor.cyan +
    EmojiAndUnicode.i +
    ConsoleFontColor.close +
    ConsoleWrapper.singleLine,
  success = ConsoleFontColor.green +
    EmojiAndUnicode.tick +
    ConsoleFontColor.close +
    ConsoleWrapper.singleLine,
  complete = `${EmojiAndUnicode.sparkles}${ConsoleWrapper.singleLine}`
}

export enum PackageManager {
  NPM = 'NPM',
  Yarn = 'Yarn',
  PNPM = 'PNPM',
  Bun = 'Bun'
}

export enum RunCommand {
  NPM = 'npm run',
  Yarn = 'yarn',
  PNPM = 'pnpm run',
  Bun = 'bun run'
}

export enum ProjectType {
  npmLib = 'npm-lib',
  frontend = 'frontend',
  backend = 'backend'
}

export enum GitHook {
  preCommit = 'pre-commit',
  commitMessage = 'commit-message',
  prePush = 'pre-push'
}

export enum ScriptStatus {
  updated = 'Updated',
  skipped = 'Skipped'
}
