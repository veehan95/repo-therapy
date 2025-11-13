export const defaultServerCodes: RepoTherapyUtil.ServerCode = {
  informational: {
    continue: { statusCode: 100 },
    switchingProtocols: { statusCode: 101 },
    processing: { statusCode: 102 },
    earlyHints: { statusCode: 103 }
  },
  success: {
    ok: { statusCode: 200 },
    created: {
      statusCode: 201,
      defaultMessage: 'Resource has been successfully created'
    },
    accepted: {
      statusCode: 202,
      defaultMessage: 'Request has been accepted for processing'
    },
    nonAuthoritativeInformation: { statusCode: 203 },
    noContent: { statusCode: 204 },
    resetContent: { statusCode: 205 },
    partialContent: {
      statusCode: 206,
      defaultMessage: 'Partial content has been delivered successfully'
    },
    multiStatus: { statusCode: 207 },
    alreadyReported: { statusCode: 208 },
    imUsed: { statusCode: 226 }
  },
  redirection: {
    multipleChoices: {
      statusCode: 300,
      defaultMessage: 'Multiple options available for this resource'
    },
    movedPermanently: {
      statusCode: 301,
      defaultMessage: 'Resource has been permanently moved to a new location'
    },
    found: {
      statusCode: 302,
      defaultMessage: 'Resource has been temporarily moved'
    },
    seeOther: {
      statusCode: 303,
      defaultMessage: 'Please refer to the provided URI for the response'
    },
    notModified: { statusCode: 304 },
    useProxy: {
      statusCode: 305,
      defaultMessage: 'Access to this resource requires using the specified ' +
        'proxy'
    },
    temporaryRedirect: {
      statusCode: 307,
      defaultMessage: 'Temporary redirect to another URI'
    },
    permanentRedirect: {
      statusCode: 308,
      defaultMessage: 'Permanent redirect to another URI'
    }
  },
  clientError: {
    badRequest: {
      statusCode: 400,
      defaultMessage: 'Invalid request format or malformed syntax'
    },
    unauthorized: {
      statusCode: 401,
      defaultMessage: 'Authentication required to access this resource'
    },
    paymentRequired: {
      statusCode: 402,
      defaultMessage: 'Payment required to complete this request'
    },
    forbidden: {
      statusCode: 403,
      defaultMessage: 'You do not have permission to access this resource'
    },
    notFound: {
      statusCode: 404,
      defaultMessage: 'The requested resource could not be found'
    },
    methodNotAllowed: {
      statusCode: 405,
      defaultMessage: 'This method is not allowed for the requested resource'
    },
    notAcceptable: {
      statusCode: 406,
      defaultMessage: 'The server cannot produce a response matching the ' +
        'acceptable formats'
    },
    proxyAuthenticationRequired: {
      statusCode: 407,
      defaultMessage: 'Proxy authentication is required'
    },
    requestTimeout: {
      statusCode: 408,
      defaultMessage: 'The request timed out waiting for completion'
    },
    conflict: {
      statusCode: 409,
      defaultMessage: 'Request conflicts with the current state of the resource'
    },
    gone: {
      statusCode: 410,
      defaultMessage: 'This resource is no longer available and has been ' +
        'permanently removed'
    },
    lengthRequired: {
      statusCode: 411,
      defaultMessage: 'Content length header is required for this request'
    },
    preconditionFailed: {
      statusCode: 412,
      defaultMessage: 'One or more request preconditions were not met'
    },
    payloadTooLarge: {
      statusCode: 413,
      defaultMessage: 'Request payload exceeds the maximum allowed size'
    },
    uriTooLong: {
      statusCode: 414,
      defaultMessage: 'The request URI is longer than the server is willing ' +
        'to interpret'
    },
    unsupportedMediaType: {
      statusCode: 415,
      defaultMessage: 'The media format of the request data is not supported'
    },
    rangeNotSatisfiable: {
      statusCode: 416,
      defaultMessage: 'The requested range cannot be satisfied for this ' +
        'resource'
    },
    expectationFailed: {
      statusCode: 417,
      defaultMessage: 'The server cannot meet the requirements of the Expect ' +
        'header'
    },
    imATeapot: {
      statusCode: 418,
      defaultMessage: 'This server is a teapot and cannot brew coffee'
    },
    misdirectedRequest: {
      statusCode: 421,
      defaultMessage: 'The request was directed to a server that cannot ' +
        'produce a response'
    },
    unprocessableEntity: {
      statusCode: 422,
      defaultMessage: 'The request contains semantic errors and cannot be ' +
        'processed'
    },
    locked: {
      statusCode: 423,
      defaultMessage: 'The requested resource is currently locked and ' +
        'unavailable'
    },
    failedDependency: {
      statusCode: 424,
      defaultMessage: 'The request failed due to a dependency error'
    },
    tooEarly: {
      statusCode: 425,
      defaultMessage: 'The server is unwilling to process the request at ' +
        'this time'
    },
    upgradeRequired: {
      statusCode: 426,
      defaultMessage: 'The client should switch to a different protocol'
    },
    preconditionRequired: {
      statusCode: 428,
      defaultMessage: 'This request requires conditional headers to be ' +
        'specified'
    },
    tooManyRequests: {
      statusCode: 429,
      defaultMessage: 'Too many requests have been sent in a given amount ' +
        'of time'
    },
    requestHeaderFieldsTooLarge: {
      statusCode: 431,
      defaultMessage: 'The request header fields are too large to process'
    },
    unavailableForLegalReasons: {
      statusCode: 451,
      defaultMessage: 'This resource is unavailable for legal reasons'
    }
  },
  serverError: {
    internalServerError: {
      statusCode: 500,
      defaultMessage: 'An unexpected error occurred on the server'
    },
    notImplemented: {
      statusCode: 501,
      defaultMessage: 'This functionality has not been implemented on the ' +
        'server'
    },
    badGateway: {
      statusCode: 502,
      defaultMessage: 'Received an invalid response from the upstream server'
    },
    serviceUnavailable: {
      statusCode: 503,
      defaultMessage: 'The service is temporarily unavailable due to ' +
        'maintenance or overload'
    },
    gatewayTimeout: {
      statusCode: 504,
      defaultMessage: 'The upstream server did not respond in time'
    },
    httpVersionNotSupported: {
      statusCode: 505,
      defaultMessage: 'The HTTP version used in the request is not supported'
    },
    variantAlsoNegotiates: {
      statusCode: 506,
      defaultMessage: 'Server configuration error prevents completing the ' +
        'request'
    },
    insufficientStorage: {
      statusCode: 507,
      defaultMessage: 'Server does not have sufficient storage to complete ' +
        'the request'
    },
    loopDetected: {
      statusCode: 508,
      defaultMessage: 'The server detected an infinite loop while processing ' +
        'the request'
    },
    notExtended: {
      statusCode: 510,
      defaultMessage: 'Further extensions are required to complete this request'
    },
    networkAuthenticationRequired: {
      statusCode: 511,
      defaultMessage: 'Network authentication is required to access this ' +
        'resource'
    }
  }
}
