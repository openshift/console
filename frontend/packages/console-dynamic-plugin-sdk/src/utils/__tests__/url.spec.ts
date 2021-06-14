import { resolveURL } from '../url';

describe('resolveURL', () => {
  const getDocumentOrigin = () => 'https://example:1234';

  it('uses the base URL as-is if it has the protocol', () => {
    expect(resolveURL('http://test', 'foo', getDocumentOrigin)).toBe('http://test/foo');
    expect(resolveURL('http://test/', 'foo', getDocumentOrigin)).toBe('http://test/foo');
    expect(resolveURL('http://test/foo/', 'bar', getDocumentOrigin)).toBe('http://test/foo/bar');
  });

  it("makes the base URL relative to document origin if it's missing the protocol", () => {
    expect(resolveURL('/', 'foo', getDocumentOrigin)).toBe('https://example:1234/foo');
    expect(resolveURL('/foo/', 'bar', getDocumentOrigin)).toBe('https://example:1234/foo/bar');
  });
});
