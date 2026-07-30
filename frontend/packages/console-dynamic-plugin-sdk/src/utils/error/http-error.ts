import { CustomError } from './custom-error';

/**
 * Error thrown by `consoleFetch`, `consoleFetchJSON`, and `consoleFetchText` when the
 * server responds with a non-OK HTTP status code (other than 304).
 *
 * @example
 * ```ts
 * try {
 *   await consoleFetchJSON('/api/kubernetes/api/v1/namespaces');
 * } catch (e) {
 *   if (e instanceof HttpError) {
 *     console.error(`HTTP ${e.code}: ${e.message}`);
 *   }
 * }
 * ```
 *
 * @param message - The error message, typically derived from the response body or status text.
 * @param code - The HTTP status code (e.g. 404, 500).
 * @param response - The original `Response` object from the fetch call.
 * @param json - The parsed JSON body of the error response, if available.
 */
export class HttpError extends CustomError {
  protected static messages = {
    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Authentication Required', // RFC 7235
    408: 'Request Timeout',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length Required',
    412: 'Precondition Failed', // RFC 7232
    413: 'Payload Too Large', // RFC 7231
    414: 'URI Too Long', // RFC 7231
    415: 'Unsupported Media Type',
    416: 'Range Not Satisfiable', // RFC 7233
    417: 'Expectation Failed',
    418: "I'm a teapot", // RFC 2324
    421: 'Misdirected Request', // RFC 7540
    426: 'Upgrade Required',
    428: 'Precondition Required', // RFC 6585
    429: 'Too Many Requests', // RFC 6585
    431: 'Request Header Fields Too Large', // RFC 6585
    451: 'Unavailable For Legal Reasons', // RFC 7725
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
    505: 'HTTP Version Not Supported',
    506: 'Variant Also Negotiates', // RFC 2295
    510: 'Not Extended', // RFC 2774
    511: 'Network Authentication Required', // RFC 6585
  };

  public constructor(
    message: string,
    public code?: number,
    public response?: Response,
    public json?: any,
  ) {
    super(message);
  }

  public static fromCode(code: number) {
    return new HttpError(HttpError.messages[code], code);
  }
}

export class TimeoutError extends CustomError {
  public constructor(public url: string, public ms: number) {
    super(`Call to ${url} timed out after ${ms}ms.`);
  }
}

export class IncompleteDataError extends CustomError {
  public constructor(public labels: string[]) {
    super(`Could not fetch all data. This data are missing: ${labels.join(', ')}.`);
  }
}

export class RetryError extends CustomError {}
