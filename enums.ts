export enum NodeEnvOptions {
  local = 'local',
  dev = 'dev',
  development = 'development',
  preProduction = 'pre-production',
  production = 'production',
  staging = 'staging',
  test = 'test'
}

export enum ConsolePrefix {
  error = '\x1b[41m ERROR \x1b[49m <serviceName>\n',
  warn = '\x1b[43m\x1b[30m WARN \x1b[39m\x1b[49m <serviceName>\n',
  info = '\x1b[36m\u2139\x1b[39m <serviceName> | ',
  success = '\x1b[32m\u2714\x1b[39m <serviceName> | ',
  complete = '✨ <serviceName> | '
}

export enum RunCommand {
  npm = 'npm run',
  yarn = 'yarn',
  pnpm = 'pnpm run',
  bun = 'bun run'
}
