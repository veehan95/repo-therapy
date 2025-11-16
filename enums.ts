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

export enum GitIgnore {
  OSGenerated = '.DS_Store\n.DS_Store?\n._*\n.Spotlight-V100\n.Trashes\n' +
    'ehthumbs.db\nThumbs.db',
  IdeNEditor = '.idea\n*.swp\n*.swo\n*~\n.workspace\n.husky\n.vscode',
  TemporaryFiles = 'tmp\ntemp\n*.tmp\n*.temp',
  Misc = '*.tgz\n*.tar.gz\n*.zip\n*.rar\n*.7z',
  Dependencies = 'node_modules\n.npm\n.npmignore',
  RuntimNEnvironment = '.env\n.env.*\n.env.*.*\n.husky/_',
  Logs = 'logs\n*.log*\nlerna-debug.log*',
  CoverageNTesting = 'coverage\n.nyc_output\n*.lcov\n.jest\nvitest-report.html',
  BuildTools = '.cache\n.parcel-cache\n.eslintcache\n.stylelintcache\n' +
    '.rpt2_cache\n.rts2_cache_cjs\n.rts2_cache_es\n.rts2_cache_umd',
  EsLint = '.eslintcache',
  TypescriptSpecific = 'dist\nbin\nbuild\nout\n*.tsbuildinfo\n*.js.map\n' +
    '*.d.ts.map'
}

export enum GitIgnorePackageManager {
  NPM = 'package-lock.json\nnpm-debug.log*\n.npm',
  Yarn = '.yarn\n.yarn/cache\n.yarn/unplugged\n.yarn/build-state.yml\n' +
    '.yarn/install-state.gz\n.pnp.*\nyarn-debug.log*\nyarn-error.log*',
  PNPM = 'pnpm-lock.yaml\n.pnpm-store/\n.pnpm-debug*',
  Bun = 'bun.lockb\nbun.lock\n.bun/',
}

export enum GitIgnoreFramework {
  Knexpresso = '.knexpresso\nuploads\ncredentials\ndocker-compose.yml',
  NextJs = '.next\nout',
  VueJs = 'node_modules\ndist\ndist-ssr\n*.local',
  NuxtJs = '.nuxt\n.nuxt-prod',
  NuxtMonorepo = '.nuxt\n.nuxt-prod\nnuxt-monorepo',
  Angular = '.aot\n.ng',
  Svelte = '.svelte-kit',
  Serverless = '.serverless',
  Dynamodb = '.dynamodb'
}

export enum ScriptStatus {
  updated = 'Updated',
  skipped = 'Skipped'
}
