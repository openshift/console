import * as _ from 'lodash';
import { resolveURL } from '../url';

describe('resolveURL', () => {
  const getDocumentOrigin = jest.fn(() => 'https://example:1234');

  it('uses the base URL as-is if it has the protocol', () => {
    expect(resolveURL('http://test', 'foobar', _.identity, getDocumentOrigin)).toBe(
      'http://test/foobar',
    );
    expect(resolveURL('http://test/', 'foobar', _.identity, getDocumentOrigin)).toBe(
      'http://test/foobar',
    );
    expect(resolveURL('http://test/foo', 'bar', _.identity, getDocumentOrigin)).toBe(
      'http://test/bar',
    );
    expect(resolveURL('http://test/foo/', 'bar', _.identity, getDocumentOrigin)).toBe(
      'http://test/foo/bar',
    );

    expect(getDocumentOrigin).not.toHaveBeenCalled();
  });

  it("makes the base URL relative to document origin if it's missing the protocol", () => {
    expect(resolveURL('/', 'foobar', _.identity, getDocumentOrigin)).toBe(
      'https://example:1234/foobar',
    );
    expect(resolveURL('/foo', 'bar', _.identity, getDocumentOrigin)).toBe(
      'https://example:1234/bar',
    );
    expect(resolveURL('/foo/', 'bar', _.identity, getDocumentOrigin)).toBe(
      'https://example:1234/foo/bar',
    );

    expect(getDocumentOrigin).toHaveBeenCalledTimes(3);
  });

  it('calls the URL processing callback before returning the URL string', () => {
    const processURL = jest.fn((url: URL) => {
      const newURL = new URL(url);

      newURL.protocol = 'http';
      newURL.hostname = 'custom-host';
      newURL.port = '8080';
      newURL.search = '?test=true';

      return newURL;
    });

    expect(resolveURL('/', 'foobar', processURL, getDocumentOrigin)).toBe(
      'http://custom-host:8080/foobar?test=true',
    );

    expect(processURL).toHaveBeenCalledWith(new URL('https://example:1234/foobar'));
  });
});
