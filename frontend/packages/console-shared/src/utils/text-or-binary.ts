/**
 * Text/binary detection for file contents.
 *
 * Contents are considered text when they are valid UTF-8 without control
 * characters, i.e. when they can be displayed as text.
 *
 * Only the first and last {@link MAX_SCAN_BYTES} are inspected: binary
 * formats contain control characters or invalid UTF-8 within their headers,
 * and trailing binary data or invalid bytes late in otherwise text contents
 * are caught by the tail scan, while the cost stays bounded for large files.
 */
import { Base64 } from 'js-base64';

const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

/**
 * Decodes base64 contents to bytes for classification. Malformed input yields
 * an empty array so callers treat the contents as text and keep the original
 * value visible and editable instead of throwing during render.
 */
export const decodeBase64 = (value?: string | null): Uint8Array => {
  try {
    return Base64.toUint8Array(value || '');
  } catch {
    return new Uint8Array(0);
  }
};

const MAX_SCAN_BYTES = 64 * 1024;

/** Control characters (e.g. null, backspace) indicate binary contents. */
const hasControlBytes = (bytes: Uint8Array): boolean => {
  for (const byte of bytes) {
    if (byte <= 8) {
      return true;
    }
  }
  return false;
};

// eslint-disable-next-line no-bitwise
const isContinuationByte = (byte: number) => (byte & 0xc0) === 0x80;

/**
 * Validates a scan sample as UTF-8. A sample cut from the middle of the
 * contents may begin or end with a partial multi-byte character: `startCut`
 * skips a leading partial sequence and `endCut` tolerates a trailing one.
 */
const isValidUtf8 = (sample: Uint8Array, startCut: boolean, endCut: boolean): boolean => {
  let start = 0;
  if (startCut) {
    while (start < 3 && start < sample.length && isContinuationByte(sample[start])) {
      start++;
    }
  }
  const bytes = start > 0 ? sample.subarray(start) : sample;
  try {
    if (endCut) {
      // A fresh decoder: a streaming decode retains the partial bytes
      new TextDecoder('utf-8', { fatal: true }).decode(bytes, { stream: true });
    } else {
      utf8Decoder.decode(bytes);
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Determine if the contents are text.
 *
 * @returns `null` if no contents were provided. Otherwise a boolean value
 * with the detection result.
 */
export const isText = (bytes?: Uint8Array | null): boolean | null => {
  if (!bytes) {
    return null;
  }
  const head = bytes.subarray(0, MAX_SCAN_BYTES);
  const tail = bytes.length > MAX_SCAN_BYTES ? bytes.subarray(bytes.length - MAX_SCAN_BYTES) : null;
  if (hasControlBytes(head) || (tail !== null && hasControlBytes(tail))) {
    return false;
  }
  if (!isValidUtf8(head, false, bytes.length > MAX_SCAN_BYTES)) {
    return false;
  }
  return tail === null || isValidUtf8(tail, true, false);
};

/**
 * Determine if the contents are binary.
 *
 * @returns `null` if no contents were provided. Otherwise a boolean value
 * with the detection result.
 */
export const isBinary = (bytes?: Uint8Array | null): boolean | null => {
  const text = isText(bytes);
  if (text == null) {
    return null;
  }
  return !text;
};

const bomPreservingDecoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

/**
 * Decodes contents to text when they are valid UTF-8, preserving a leading
 * BOM to match the previous Buffer.toString('utf-8') behavior. Returns null
 * for invalid UTF-8 so callers can fall back to binary and preserve the
 * original bytes.
 */
export const decodeText = (bytes: Uint8Array): string | null => {
  try {
    return bomPreservingDecoder.decode(bytes);
  } catch {
    return null;
  }
};

/**
 * Decodes base64 contents to text when they can be displayed and round-trip
 * as valid UTF-8 without control characters, preserving a leading BOM.
 * Returns null for binary or malformed contents so callers keep the original
 * value as binary.
 */
export const decodeBase64Text = (value?: string | null): string | null => {
  if (!value) {
    return '';
  }
  const bytes = decodeBase64(value);
  if (bytes.length === 0 || isBinary(bytes)) {
    return null;
  }
  return decodeText(bytes);
};
