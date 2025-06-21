export const base = {
  project: { type: 'string' },
  projectLang: { type: 'string', generate: false },
  tz: { type: 'string', optional: true, generate: false },
  nodeEnv: { type: 'string', default: 'local' }
}

export const database = {
  host: { type: 'string', default: 'localhost' },
  name: { type: 'string' },
  user: { type: 'string' },
  password: { type: 'string' },
  sslRejectUnauthorized: { type: 'boolean', optional: true },
  port: { type: 'number', default: 5432, generate: false },
  pool: {
    min: { type: 'number', default: 1, generate: false },
    max: { type: 'number', default: 10, generate: false }
  }
}

export const postgres = JSON.parse(JSON.stringify(database))
postgres.port.default = 5432

export const aws = {
  region: { type: 'string', generate: false },
  access: {
    key: { type: 'string' },
    secret: { type: 'string' }
  }
}

export const cognito = {
  region: { type: 'string', optional: true, generate: false },
  domain: { type: 'string' },
  clientId: { type: 'string' },
  clientSecret: { type: 'string' }
}

export const mailer = {
  client: { type: 'string' },
  name: { type: 'string' },
  email: { type: 'string' },
  password: { type: 'string' },
  host: { type: 'string' },
  port: { type: 'number' }
}
export const mailgun = JSON.parse(JSON.stringify(mailer))
mailgun.host.default = 'smtp.mailgun.org'
mailgun.port.default = 465

export const google = {
  email: { type: 'string' },
  pkey: { type: 'string' }
}

export const backend = {
  host: { type: 'string', default: 'http://localhost:3000' },
  port: { type: 'number', default: 3000 },
  cdnURL: {
    type: 'string',
    default: 'http://localhost:3000/images',
    generate: false
  }
}

export default {
  aws,
  backend,
  base,
  cognito,
  database,
  google,
  mailer,
  mailgun
}
