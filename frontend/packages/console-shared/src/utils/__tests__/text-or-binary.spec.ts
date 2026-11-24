import { Base64 } from 'js-base64';
import { decodeBase64, decodeBase64Text, decodeText, isBinary, isText } from '../text-or-binary';

describe('text-or-binary', () => {
  describe('isText', () => {
    it('returns null when no contents are provided', () => {
      expect(isText(null)).toBe(null);
      expect(isText(undefined)).toBe(null);
    });

    it('detects text contents', () => {
      expect(isText(new TextEncoder().encode('apiVersion: v1\nkind: Secret'))).toBe(true);
    });

    it('detects binary contents', () => {
      expect(isText(new Uint8Array([0x00, 0x01, 0x02, 0x03]))).toBe(false);
      expect(isText(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(false);
    });

    it('detects binary contents in the middle of large contents', () => {
      const bytes = new TextEncoder().encode('a'.repeat(1000));
      bytes[490] = 0xff; // invalid UTF-8 byte
      expect(isText(bytes)).toBe(false);
    });

    it('detects binary contents at the end of large contents', () => {
      const bytes = new TextEncoder().encode('a'.repeat(1000));
      bytes[999] = 0x00; // control character
      expect(isText(bytes)).toBe(false);
    });

    it('only inspects the first and last 64 KiB of large contents', () => {
      // Bounded scan: the middle is not inspected, keeping the cost
      // independent of the size. Binary formats contain control characters or
      // invalid UTF-8 within their headers, so the head is enough to detect
      // them, and the tail catches trailing binary data.
      const bytes = new TextEncoder().encode('a'.repeat(192 * 1024));
      bytes[96 * 1024] = 0x00; // control character in the unscanned middle
      expect(isText(bytes)).toBe(true);
    });

    it('detects binary data at the end of large contents', () => {
      const bytes = new TextEncoder().encode('a'.repeat(128 * 1024));
      bytes[bytes.length - 1] = 0xff; // invalid UTF-8 byte within the tail scan
      expect(isText(bytes)).toBe(false);
    });

    it('detects control characters at the end of large contents', () => {
      const bytes = new TextEncoder().encode('a'.repeat(128 * 1024));
      bytes[bytes.length - 1] = 0x00;
      expect(isText(bytes)).toBe(false);
    });

    it('treats text as text when a multi-byte character spans the head scan boundary', () => {
      // The 4-byte emoji starts two bytes before the cap, so the head sample
      // ends in the middle of the character
      const bytes = new TextEncoder().encode(`${'a'.repeat(64 * 1024 - 2)}😀`);
      expect(bytes.length).toBe(64 * 1024 + 2);
      expect(isText(bytes)).toBe(true);
    });

    it('treats text as text when a multi-byte character spans the tail scan boundary', () => {
      // The 4-byte emoji starts one byte before the tail sample begins, so
      // the tail starts with the three continuation bytes of the character
      const bytes = new TextEncoder().encode(
        `${'a'.repeat(64 * 1024 - 1)}😀${'a'.repeat(64 * 1024 - 3)}`,
      );
      expect(bytes.length).toBe(128 * 1024);
      expect(isText(bytes)).toBe(true);
    });

    it('accepts valid multi-byte UTF-8 contents', () => {
      expect(isText(new TextEncoder().encode('ünïcödé 蛋炒饭 🎉'))).toBe(true);
      expect(isText(new TextEncoder().encode('شاورما دجاج على طريقة أون ذا روكس'))).toBe(true);
    });

    it('treats empty contents as text', () => {
      expect(isText(new Uint8Array(0))).toBe(true);
    });
  });

  describe('isBinary', () => {
    it('returns null when no contents are provided', () => {
      expect(isBinary(null)).toBe(null);
    });

    it('inverts the isText result', () => {
      expect(isBinary(new TextEncoder().encode('hello'))).toBe(false);
      expect(isBinary(new Uint8Array([0x00]))).toBe(true);
    });
  });

  describe('decodeText', () => {
    it('decodes valid UTF-8 and preserves a leading BOM', () => {
      expect(decodeText(new Uint8Array([0xef, 0xbb, 0xbf, 0x70, 0x61, 0x73, 0x73]))).toBe(
        '\uFEFFpass',
      );
    });

    it('returns null for invalid UTF-8', () => {
      expect(decodeText(new Uint8Array([0x61, 0xe9]))).toBe(null);
    });
  });

  describe('decodeBase64Text', () => {
    it('decodes base64 contents to text', () => {
      expect(decodeBase64Text(Base64.encode('hello'))).toBe('hello');
    });

    it('returns null for binary contents', () => {
      expect(decodeBase64Text(Base64.fromUint8Array(new Uint8Array([0x00, 0x01])))).toBe(null);
    });

    it('returns null for invalid UTF-8 in the unsampled middle', () => {
      const bytes = new Uint8Array(192 * 1024).fill(0x61);
      bytes[98292] = 0xe9;
      expect(decodeBase64Text(Base64.fromUint8Array(bytes))).toBe(null);
    });

    it('returns an empty string for empty values', () => {
      expect(decodeBase64Text('')).toBe('');
      expect(decodeBase64Text(null)).toBe('');
    });

    it('returns null for malformed base64', () => {
      expect(decodeBase64Text('a')).toBe(null);
    });

    it('returns the decoded bytes for malformed base64 via decodeBase64', () => {
      // decodeBase64 itself stays lenient: malformed input yields an empty
      // array rather than throwing
      expect(decodeBase64('a')).toEqual(new Uint8Array(0));
    });
  });

  // Multi-byte cases derived from the upstream istextorbinary test suite
  // https://github.com/bevry/istextorbinary/blob/master/source/test.ts
  describe('upstream multi-byte cases', () => {
    const cases = [
      '12345678901234567890123Ф',
      '12345678901234567890123안',
      '1234567890123456789012안',
      '12345678901234567890123😀',
      '1234567890123456789012😀',
      '123456789012345678901😀',
      'dummyФ12345678901234567890123',
      'dummy안12345678901234567890123',
      'dummy안1234567890123456789012',
      'dummy😀12345678901234567890123',
      'dummy😀1234567890123456789012',
      'dummy😀123456789012345678901',
    ];

    it('accepts multi-byte UTF-8 characters at any position', () => {
      cases.forEach((str) => {
        expect(isText(new TextEncoder().encode(str))).toBe(true);
      });
    });
  });
});
