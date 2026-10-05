import type { ErrorMeta } from './types.js'
import type RepoTherapy from './repo-therapy.js'
import type { ErrorCode } from '../generated/types/errors.js'
import _ from 'lodash'

type CodeMultiple = `${string}_multiple` | 'multiple'

type AddFn <Code extends string> = Code extends CodeMultiple
  ? (error: Error) => void
  : never

type JsonFn <Code extends string> = () => ({
  code: string
  statusCode: number
  internalStatusCode: number
  fields?: string[]
  path?: string[]
} & (
  Code extends CodeMultiple
    ? {
      details: {
        code: string
        statusCode: number
        internalStatusCode: number
        fields?: string[]
        path?: string[]
      }[]
    }
    : {}
))

const baseErrorCode = {
  invalid_type: {
    statusCode: 400,
    internalStatusCode: 1,
    message: 'Invalid type'
  },
  too_big: {
    statusCode: 400,
    internalStatusCode: 2,
    message: 'Too big'
  },
  too_small: {
    statusCode: 400,
    internalStatusCode: 3,
    message: 'Too small'
  },
  invalid_format: {
    statusCode: 400,
    internalStatusCode: 4,
    message: 'Invalid format'
  },
  not_multiple_of: {
    statusCode: 400,
    internalStatusCode: 5,
    message: 'Not a multiple of'
  },
  unrecognized_keys: {
    statusCode: 400,
    internalStatusCode: 6,
    message: 'Unrecognized keys'
  },
  invalid_union: {
    statusCode: 400,
    internalStatusCode: 7,
    message: 'Invalid union'
  },
  invalid_key: {
    statusCode: 400,
    internalStatusCode: 8,
    message: 'Invalid key'
  },
  invalid_element: {
    statusCode: 400,
    internalStatusCode: 9,
    message: 'Invalid element'
  },
  invalid_value: {
    statusCode: 400,
    internalStatusCode: 10,
    message: 'Invalid value'
  },
  invalid_request: {
    statusCode: 400,
    internalStatusCode: 11,
    message: 'Invalid request'
  },
  mandatory_parameter: {
    statusCode: 400,
    internalStatusCode: 12,
    message: 'Missing parameter'
  },
  non_nullable: {
    statusCode: 400,
    internalStatusCode: 13,
    message: 'Value cannot be null'
  },
  malformed_json: {
    statusCode: 400,
    internalStatusCode: 14,
    message: 'Malformed JSON'
  },
  type_mismatch: {
    statusCode: 400,
    internalStatusCode: 15,
    message: 'Type mismatch'
  },
  invalid_query_string: {
    statusCode: 400,
    internalStatusCode: 16,
    message: 'Invalid query string'
  },
  invalid_option: {
    statusCode: 400,
    internalStatusCode: 17,
    message: 'Invalid option'
  },
  missing_credentials: {
    statusCode: 401,
    internalStatusCode: 1,
    message: 'Missing credentials'
  },
  invalid_credentials: {
    statusCode: 401,
    internalStatusCode: 2,
    message: 'Invalid credentials'
  },
  invalid_token: {
    statusCode: 401,
    internalStatusCode: 3,
    message: 'Invalid token'
  },
  expired_token: {
    statusCode: 401,
    internalStatusCode: 4,
    message: 'Expired token'
  },
  token_revoked: {
    statusCode: 401,
    internalStatusCode: 5,
    message: 'Token revoked'
  },
  invalid_api_key: {
    statusCode: 401,
    internalStatusCode: 6,
    message: 'Invalid api key'
  },
  session_expired: {
    statusCode: 401,
    internalStatusCode: 7,
    message: 'Session expired'
  },
  mfa_required: {
    statusCode: 401,
    internalStatusCode: 8,
    message: 'MFA required'
  },
  payment_failed: {
    statusCode: 402,
    internalStatusCode: 1,
    message: 'Payment failed'
  },
  card_declined: {
    statusCode: 402,
    internalStatusCode: 2,
    message: 'Card declined'
  },
  insufficient_funds: {
    statusCode: 402,
    internalStatusCode: 3,
    message: 'Insufficient funds'
  },
  subscription_expired: {
    statusCode: 402,
    internalStatusCode: 4,
    message: 'Subscription expired'
  },
  payment_quota_exceeded: {
    statusCode: 402,
    internalStatusCode: 5,
    message: 'Quota exceeded'
  },
  trial_ended: {
    statusCode: 402,
    internalStatusCode: 6,
    message: 'Trial ended'
  },
  insufficient_permissions: {
    statusCode: 403,
    internalStatusCode:1,
    message: 'Insufficient permissions'
  },
  access_denied: {
    statusCode: 403,
    internalStatusCode: 2,
    message: 'Access denied'
  },
  account_suspended: {
    statusCode: 403,
    internalStatusCode: 3,
    message: 'Account suspended'
  },
  account_banned: {
    statusCode: 403,
    internalStatusCode: 4,
    message: 'Account banned'
  },
  resource_restricted: {
    statusCode: 403,
    internalStatusCode: 5,
    message: 'Resource restricted'
  },
  ip_blocked: {
    statusCode: 403,
    internalStatusCode: 6,
    message: 'IP blocked'
  },
  csrf_token_invalid: {
    statusCode: 403,
    internalStatusCode: 7,
    message: 'CSRF token invalid'
  },
  scope_insufficient: {
    statusCode: 403,
    internalStatusCode: 8,
    message: 'Insufficient scope'
  },
  resource_not_found: {
    statusCode: 404,
    internalStatusCode: 1,
    message: 'Resource not found'
  },
  user_not_found: {
    statusCode: 404,
    internalStatusCode: 2,
    message: 'User not found'
  },
  endpoint_not_found: {
    statusCode: 404,
    internalStatusCode: 3,
    message: 'Endpoint not found'
  },
  record_deleted: {
    statusCode: 404,
    internalStatusCode: 4,
    message: 'Record deleted'
  },
  route_not_found: {
    statusCode: 404,
    internalStatusCode: 5,
    message: 'Route not found'
  },
  method_not_supported: {
    statusCode: 405,
    internalStatusCode: 1,
    message: 'Method not supported'
  },
  read_only_resource: {
    statusCode: 405,
    internalStatusCode: 2,
    message: 'Read-only resource'
  },
  unsupported_accept_header: {
    statusCode: 406,
    internalStatusCode: 1,
    message: 'Unsupported accept header'
  },
  unsupported_content_negotiation: {
    statusCode: 406,
    internalStatusCode: 2,
    message: 'Unsupported content negotiation'
  },
  proxy_auth_required: {
    statusCode: 407,
    internalStatusCode: 1,
    message: 'Proxy authentication required'
  },
  invalid_proxy_credentials: {
    statusCode: 407,
    internalStatusCode: 2,
    message: 'Invalid proxy credentials'
  },
  client_timeout: {
    statusCode: 408,
    internalStatusCode: 1,
    message: 'Client timeout'
  },
  upload_timeout: {
    statusCode: 408,
    internalStatusCode: 2,
    message: 'Upload timeout'
  },
  idle_connection_timeout: {
    statusCode: 408,
    internalStatusCode: 3,
    message: 'Idle connection timeout'
  },
  resource_conflict: {
    statusCode: 409,
    internalStatusCode: 1,
    message: 'Resource conflict'
  },
  duplicate_entry: {
    statusCode: 409,
    internalStatusCode: 2,
    message: 'Duplicate entry'
  },
  version_conflict: {
    statusCode: 409,
    internalStatusCode: 3,
    message: 'Version conflict'
  },
  concurrent_modification: {
    statusCode: 409,
    internalStatusCode: 4,
    message: 'Concurrent modification'
  },
  state_conflict: {
    statusCode: 409,
    internalStatusCode: 5,
    message: 'State conflict'
  },
  resource_deleted: {
    statusCode: 410,
    internalStatusCode: 1,
    message: 'Resource deleted'
  },
  endpoint_deprecated: {
    statusCode: 410,
    internalStatusCode: 2,
    message: 'Endpoint deprecated'
  },
  link_expired: {
    statusCode: 410,
    internalStatusCode: 3,
    message: 'Link expired'
  },
  missing_content_length: {
    statusCode: 411,
    internalStatusCode: 1,
    message: 'Missing content length'
  },
  etag_mismatch: {
    statusCode: 412,
    internalStatusCode: 1,
    message: 'ETag mismatch'
  },
  if_match_failed: {
    statusCode: 412,
    internalStatusCode: 2,
    message: 'If-Match failed'
  },
  if_unmodified_since_failed: {
    statusCode: 412,
    internalStatusCode: 3,
    message: 'If-Unmodified-Since failed'
  },
  file_too_large: {
    statusCode: 413,
    internalStatusCode: 1,
    message: 'File too large'
  },
  payload_too_large: {
    statusCode: 413,
    internalStatusCode: 2,
    message: 'Payload too large'
  },
  upload_limit_exceeded: {
    statusCode: 413,
    internalStatusCode: 3,
    message: 'Upload limit exceeded'
  },
  uri_too_long: {
    statusCode: 414,
    internalStatusCode: 1,
    message: 'URI too long'
  },
  query_string_too_long: {
    statusCode: 414,
    internalStatusCode: 2,
    message: 'Query string too long'
  },
  unsupported_content_type: {
    statusCode: 415,
    internalStatusCode: 1,
    message: 'Unsupported content type'
  },
  invalid_mime_type: {
    statusCode: 415,
    internalStatusCode: 2,
    message: 'Invalid MIME type'
  },
  invalid_range: {
    statusCode: 416,
    internalStatusCode: 1,
    message: 'Invalid range'
  },
  range_out_of_bounds: {
    statusCode: 416,
    internalStatusCode: 2,
    message: 'Range out of bounds'
  },
  expectation_failed: {
    statusCode: 417,
    internalStatusCode: 1,
    message: 'Expectation failed'
  },
  teapot: {
    statusCode: 418,
    internalStatusCode: 1,
    message: 'I\'m a teapot'
  },
  wrong_server: {
    statusCode: 421,
    internalStatusCode: 1,
    message: 'Wrong server'
  },
  misdirected_request: {
    statusCode: 421,
    internalStatusCode: 2,
    message: 'Misdirected request'
  },
  validation_error: {
    statusCode: 422,
    internalStatusCode: 1,
    message: 'Validation error'
  },
  semantic_error: {
    statusCode: 422,
    internalStatusCode: 2,
    message: 'Semantic error'
  },
  business_rule_violation: {
    statusCode: 422,
    internalStatusCode: 3,
    message: 'Business rule violation'
  },
  unprocessable_entity: {
    statusCode: 422,
    internalStatusCode: 4,
    message: 'Unprocessable entity'
  },
  resource_locked: {
    statusCode: 423,
    internalStatusCode: 1,
    message: 'Resource locked'
  },
  account_locked: {
    statusCode: 423,
    internalStatusCode: 2,
    message: 'Account locked'
  },
  dependency_failed: {
    statusCode: 424,
    internalStatusCode: 1,
    message: 'Dependency failed'
  },
  upstream_error: {
    statusCode: 424,
    internalStatusCode: 2,
    message: 'Upstream error'
  },
  replay_risk: {
    statusCode: 425,
    internalStatusCode: 1,
    message: 'Replay risk'
  },
  upgrade_required: {
    statusCode: 426,
    internalStatusCode: 1,
    message: 'Upgrade required'
  },
  tls_required: {
    statusCode: 426,
    internalStatusCode: 2,
    message: 'TLS required'
  },
  protocol_upgrade_needed: {
    statusCode: 426,
    internalStatusCode: 3,
    message: 'Protocol upgrade needed'
  },
  precondition_required: {
    statusCode: 428,
    internalStatusCode: 1,
    message: 'Precondition required'
  },
  missing_if_match: {
    statusCode: 428,
    internalStatusCode: 2,
    message: 'Missing If-Match header'
  },
  rate_limit_exceeded: {
    statusCode: 429,
    internalStatusCode: 1,
    message: 'Rate limit exceeded'
  },
  quota_exceeded: {
    statusCode: 429,
    internalStatusCode: 2,
    message: 'Quota exceeded'
  },
  too_many_login_attempts: {
    statusCode: 429,
    internalStatusCode: 3,
    message: 'Too many login attempts'
  },
  concurrent_request_limit: {
    statusCode: 429,
    internalStatusCode: 4,
    message: 'Concurrent request limit exceeded'
  },
  header_too_large: {
    statusCode: 431,
    internalStatusCode: 1,
    message: 'Header too large'
  },
  cookie_too_large: {
    statusCode: 431,
    internalStatusCode: 2,
    message: 'Cookie too large'
  },
  legal_restriction: {
    statusCode: 451,
    internalStatusCode: 1,
    message: 'Legal restriction'
  },
  content_blocked_by_law: {
    statusCode: 451,
    internalStatusCode: 2,
    message: 'Content blocked by law'
  },
  dmca_takedown: {
    statusCode: 451,
    internalStatusCode: 3,
    message: 'DMCA takedown'
  },
  geo_restricted: {
    statusCode: 451,
    internalStatusCode: 4,
    message: 'Geo restricted'
  },
  internal_error: {
    statusCode: 500,
    internalStatusCode: 1,
    message: 'Internal error'
  },
  unexpected_error: {
    statusCode: 500,
    internalStatusCode: 2,
    message: 'Unexpected error'
  },
  unhandled_exception: {
    statusCode: 500,
    internalStatusCode: 3,
    message: 'Unhandled exception'
  },
  database_error: {
    statusCode: 500,
    internalStatusCode: 4,
    message: 'Database error'
  },
  server_configured_configuration: {
    statusCode: 500,
    internalStatusCode: 5,
    message: 'Configured configuration'
  },
  server_conflicting_configuration: {
    statusCode: 500,
    internalStatusCode: 6,
    message: 'Conflicting configuration'
  },
  server_disabled_configuration: {
    statusCode: 500,
    internalStatusCode: 7,
    message: 'Disabled configuration'
  },
  server_configuration_locked: {
    statusCode: 500,
    internalStatusCode: 8,
    message: 'Configuration locked'
  },
  server_not_init: {
    statusCode: 500,
    internalStatusCode: 9,
    message: 'Not initialized'
  },
  server_configuration_undefined: {
    statusCode: 500,
    internalStatusCode: 10,
    message: 'Configuration undefined'
  },
  server_configuration_unknown: {
    statusCode: 500,
    internalStatusCode: 10,
    message: 'Unknown configuration'
  },
  server_resource_not_found: {
    statusCode: 500,
    internalStatusCode: 11,
    message: 'Resource not found'
  },
  server_user_not_found: {
    statusCode: 500,
    internalStatusCode: 12,
    message: 'User not found'
  },
  server_endpoint_not_found: {
    statusCode: 500,
    internalStatusCode: 13,
    message: 'Endpoint not found'
  },
  server_record_deleted: {
    statusCode: 500,
    internalStatusCode: 14,
    message: 'Record deleted'
  },
  server_route_not_found: {
    statusCode: 500,
    internalStatusCode: 15,
    message: 'Route not found'
  },
  not_implemented: {
    statusCode: 501,
    internalStatusCode: 1,
    message: 'Not implemented'
  },
  unsupported_operation: {
    statusCode: 501,
    internalStatusCode: 2,
    message: 'Unsupported operation'
  },
  feature_disabled: {
    statusCode: 501,
    internalStatusCode: 3,
    message: 'Feature disabled'
  },
  server_upstream_error: {
    statusCode: 502,
    internalStatusCode: 1,
    message: 'Upstream error'
  },
  invalid_upstream_response: {
    statusCode: 502,
    internalStatusCode: 2,
    message: 'Invalid upstream response'
  },
  gateway_error: {
    statusCode: 502,
    internalStatusCode: 3,
    message: 'Gateway error'
  },
  service_unavailable: {
    statusCode: 503,
    internalStatusCode: 1,
    message: 'Service unavailable'
  },
  maintenance_mode: {
    statusCode: 503,
    internalStatusCode: 2,
    message: 'Maintenance mode'
  },
  overloaded: {
    statusCode: 503,
    internalStatusCode: 3,
    message: 'Overloaded'
  },
  dependency_unavailable: {
    statusCode: 503,
    internalStatusCode: 4,
    message: 'Dependency unavailable'
  },
  upstream_timeout: {
    statusCode: 504,
    internalStatusCode: 1,
    message: 'Upstream timeout'
  },
  gateway_timeout: {
    statusCode: 504,
    internalStatusCode: 2,
    message: 'Gateway timeout'
  },
  unsupported_http_version: {
    statusCode: 505,
    internalStatusCode: 1,
    message: 'Unsupported HTTP version'
  },
  variant_negotiation_error: {
    statusCode: 506,
    internalStatusCode: 1,
    message: 'Variant negotiation error'
  },
  insufficient_storage: {
    statusCode: 507,
    internalStatusCode: 1,
    message: 'Insufficient storage'
  },
  disk_full: {
    statusCode: 507,
    internalStatusCode: 2,
    message: 'Disk full'
  },
  infinite_loop_detected: {
    statusCode: 508,
    internalStatusCode: 1,
    message: 'Infinite loop detected'
  },
  extension_required: {
    statusCode: 510,
    internalStatusCode: 1,
    message: 'Extension required'
  },
  network_auth_required: {
    statusCode: 511,
    internalStatusCode: 1,
    message: 'Network authentication required'
  },
  captive_portal: {
    statusCode: 511,
    internalStatusCode: 2,
    message: 'Captive portal'
  },
  custom: {
    statusCode: 400,
    internalStatusCode: 996,
    message: 'Custom error'
  },
  unknown: {
    statusCode: 400,
    internalStatusCode: 997,
    message: 'Unknown error'
  },
  multiple: {
    statusCode: 400,
    internalStatusCode: 998,
    message: 'Multiple'
  },
  undefined_error: {
    statusCode: 400,
    internalStatusCode: 999,
    message: 'Undefined error'
  },
  invalid_server_status_code: {
    statusCode: 500,
    internalStatusCode: 996,
    message: 'Invalid status code'
  },
  server_undefined_error: {
    statusCode: 500,
    internalStatusCode: 997,
    message: 'Undefined error'
  },
  server_multiple: {
    statusCode: 500,
    internalStatusCode: 998,
    message: 'Multiple'
  },
  server_unknown: {
    statusCode: 500,
    internalStatusCode: 999,
    message: 'Unknown error'
  }
}

const serverUnknown = {
  ...baseErrorCode.server_unknown,
  code: 'server_unknown'
}

export enum ErrorStatusCode {
  BadRequest = 400,
  UnauthorizedMeta = 401,
  PaymentRequired = 402,
  Forbidden = 403,
  NotFound = 404,
  MethodNotAllowed = 405,
  NotAcceptable = 406,
  ProxyAuthenticationRequired = 407,
  RequestTimeout = 408,
  Conflict = 409,
  Gone = 410,
  LengthRequired = 411,
  PreconditionFailed = 412,
  ContentTooLarge = 413,
  URITooLong = 414,
  UnsupportedMediaType = 415,
  RangeNotSatisfiable = 416,
  ExpectationFailed = 417,
  ImATeapot = 418,
  MisdirectedRequest = 421,
  UnprocessableContent = 422,
  ErrorLocked = 423,
  FailedDependency = 424,
  TooEarly = 425,
  UpgradeRequired = 426,
  PreconditionRequired = 428,
  TooManyRequests = 429,
  RequestHeaderFieldsTooLarge = 431,
  UnavailableForLegalReasons = 451,
  InternalServerError = 500,
  NotImplemented = 501,
  BadGateway = 502,
  ServiceUnavailable = 503,
  GatewayTimeout = 504,
  HTTPVersionNotSupported = 505,
  VariantAlsoNegotiates = 506,
  InsufficientStorage = 507,
  LoopDetected = 508,
  NotExtended = 510,
  NetworkAuthenticationRequired = 511
}

type ErrorInput = {
  fields?: (string | number | undefined)[]
  path?: string[]
  message?: string
} & (Error | {})

export default class RTDocumentedError <
  Meta extends ErrorMeta & { code: string }
> extends Error {
  readonly code: Meta['code']
  
  readonly statusCode: number

  readonly internalStatusCode: number

  readonly fullStatusCode: number

  readonly fields: (string | number | undefined)[]

  path: (string | number)[]

  public get isMultiple () {
    return this.code === 'multiple' || /_multiple$/.test(this.code)
  }

  readonly details = [] as unknown as Meta['code'] extends CodeMultiple
    ? {
      code: string
      fullStatusCode: number
      statusCode: number
      internalStatusCode: number
      fields?: (string | number | undefined)[]
      path?: (string | number)[]
    }[]
    : never

  constructor(
    meta: Meta,
    input?: ErrorInput,
    fn?: Function
  ) {
    super()
    if (
      !meta ||
      !meta.code ||
      !meta.statusCode ||
      !meta.internalStatusCode ||
      !meta.message
    ) { throw new RTDocumentedError(serverUnknown) }
    this.code = meta.code
    this.statusCode = meta.statusCode
    this.internalStatusCode = meta.internalStatusCode
    if (this.statusCode > 600 && this.statusCode < 400) {
      throw new Error
    } else {
      this.name = meta.name || ((
        this.statusCode >= 500
          ? 'ServerError'
          : 'ClientError'
      ) + (ErrorStatusCode[this.statusCode] || this.statusCode))
    }
    this.fullStatusCode = (this.statusCode * 1000) + this.internalStatusCode
    this.fields = input?.fields || []
    this.message = this._parseMessage(input?.message || meta.message)
    this.path = input?.path || []

    this._hide('push', this.isMultiple ? this._push as AddFn<Meta['code']> : [])
    if (!this.isMultiple) { this._hide('details' as keyof this, []) }

    Object.setPrototypeOf(this, new.target.prototype)
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, fn || new.target)
    }

    if (input && input instanceof Error) { this.stack = input.stack }
  }

  private _push (err: Error, fn?: Function) {
    const baseError = err instanceof RTDocumentedError
      ? (err as RTDocumentedError<Meta>)
      : new RTDocumentedError(serverUnknown, err, fn)
    const details: {
      code: string
      fullStatusCode: number
      statusCode: number
      internalStatusCode: number
      fields?: (string | number | undefined)[]
      path?: (string | number)[]
    }[] = (
      baseError.isMultiple
        ? baseError.details
        : [{
          code: baseError.code,
          fullStatusCode: baseError.fullStatusCode,
          statusCode: baseError.statusCode,
          internalStatusCode: baseError.internalStatusCode,
          fields: baseError.fields,
          path: baseError.path
        }]
    ).map((x) => {
      const fields = [...(this.fields || []), ...(x.fields || [])]
      const path = [...(this.path || []), ...(x.path || [])]
      return {
        code: x.code,
        fullStatusCode: x.fullStatusCode,
        statusCode: x.statusCode,
        internalStatusCode: x.internalStatusCode,
        fields: fields.length > 0 ? fields : undefined,
        path: path.length > 0 ? path : undefined
      }
    })
    this.details.push(...details)
  }

  protected _hide <Key extends keyof this> (
    key: Key,
    value: this[Key] | never[]
  ) {
    Object.defineProperty(this, key, {
      value,
      enumerable: false,
      configurable: false,
      writable: false
    })
    return value
  }

  protected _parseMessage (message: string) {
    return message.replace(/\{\{([^}]*)\}\}/, (x) => {
      const index = Number(x.replace(/(^\{\{)|(\}\}$)/g , ''))
      return this.fields[index - 1]?.toString() || x
    })
  }

  public push: AddFn<Meta['code']> = undefined as unknown as AddFn<Meta['code']>

  public pushPath (...args: (string | number)[]) {
    this.path = [...args, ...this.path]
  }

  public json () {
    const base = {
      code: this.code,
      statusCode: this.statusCode,
      internalStatusCode: this.internalStatusCode,
      fields: this.fields,
      path: this.path
    } as unknown as ReturnType<JsonFn<Meta['code']>>
    return this.isMultiple
      ? { ...base, details: this.details }
      : base
  }

  public reanchorStack (fn: Function) {
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, fn)
    }
  }

  public static async loader (
    repoTherapy: RepoTherapy
  ): Promise<
    new <T extends ErrorCode> (
      code: T,
      input?: ErrorInput,
      fn?: Function
    ) => RTDocumentedError<ErrorMeta & { code: T }>
  > {
    const errorMeta = await repoTherapy
      .importScript<{
        default: () => Record<string, ErrorMeta>
      }>(['error-codes'], '/config/error-codes.ts', true)
      .then(x => ([
        baseErrorCode,
        ...x.map(meta => meta.import.default())
      ] as Record<string, ErrorMeta>[]).reduce((acc, meta) => {
        Object.entries(meta).forEach(([code, m]) => {
          const c = _.snakeCase(code)
          if (!acc[c]) { acc[c] = m }
        })
        return acc
      }, {} as Record<string, ErrorMeta>))
    const content = Object.keys(errorMeta).reduce((acc, cur) => {
      if (
        !acc[acc.length - 1] || acc[acc.length - 1]!.length >= 80
      ) { acc.push('') }
      acc[acc.length - 1] += ` | '${cur}'`
      return acc
    }, [] as string[]).join('\n ').trim()
    repoTherapy.generateFile(
      '/types/errors.ts',
      `export type ErrorCode =${!content ? ' string' : `\n  ${content}`}`
    )

    const DocumentedError = (await repoTherapy.importScript<
      { default: typeof RTDocumentedError }
    >(['error-class'], '/config/error.ts'))?.import.default || RTDocumentedError
    return class <T extends ErrorCode> extends DocumentedError<
      typeof errorMeta[T] & { code: T }
    > {
      constructor(
        code: T, 
        input?: ErrorInput,
        fn?: Function
      ) {
        super({
          ...(errorMeta[code] || {}),
          code
        } as unknown as ErrorMeta & { code: T }, input, fn)
      }
    }
  }
}
