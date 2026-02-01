import { isEncodedCodeRef, parseEncodedCodeRefValue } from '../coderef-resolver';

const originalConsole = { ...console };
const consoleMock = jest.fn();

beforeEach(() => {
  jest.resetAllMocks();
  // eslint-disable-next-line no-console
  ['log', 'info', 'warn', 'error'].forEach((key) => (console[key] = consoleMock));
});

afterEach(() => {
  // eslint-disable-next-line no-console
  ['log', 'info', 'warn', 'error'].forEach((key) => (console[key] = originalConsole[key]));
});

describe('isEncodedCodeRef', () => {
  it('returns true if obj is structured as { $codeRef: string }', () => {
    expect(isEncodedCodeRef({})).toBe(false);
    expect(isEncodedCodeRef({ $codeRef: true })).toBe(false);
    expect(isEncodedCodeRef({ $codeRef: 'foo' })).toBe(true);
    expect(isEncodedCodeRef({ $codeRef: 'foo', bar: true })).toBe(false);
  });
});

describe('parseEncodedCodeRefValue', () => {
  it('returns [moduleName, exportName] tuple if value has the right format', () => {
    expect(parseEncodedCodeRefValue('foo.bar')).toEqual(['foo', 'bar']);
    expect(parseEncodedCodeRefValue('foo')).toEqual(['foo', 'default']);
  });

  it('returns an empty array if value does not have the expected format', () => {
    expect(parseEncodedCodeRefValue('')).toEqual([]);
    expect(parseEncodedCodeRefValue('.')).toEqual([]);
    expect(parseEncodedCodeRefValue('.bar')).toEqual([]);
    expect(parseEncodedCodeRefValue('.bar.')).toEqual([]);
  });
});
