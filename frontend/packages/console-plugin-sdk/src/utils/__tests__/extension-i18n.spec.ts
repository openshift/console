import type { Extension } from '@console/dynamic-plugin-sdk/src/types';
import {
  isTranslatableString,
  getTranslationKey,
  getNamespacesFromExtensions,
  translateExtension,
} from '../extension-i18n';

const nonTranslatableStrings: string[] = ['', null, undefined, '%', 'a%', '%a', '%%', 'foo'];

describe('isTranslatableString', () => {
  it("returns true only for strings matching the '%key%' pattern", () => {
    expect(isTranslatableString('%foo%')).toBe(true);
    expect(isTranslatableString('%test~key%')).toBe(true);

    nonTranslatableStrings.forEach((s) => {
      expect(isTranslatableString(s)).toBe(false);
    });
  });
});

describe('getTranslationKey', () => {
  it('extracts the key portion for strings which are translatable', () => {
    expect(getTranslationKey('%foo%')).toBe('foo');
    expect(getTranslationKey('%test~key%')).toBe('test~key');
  });

  it('returns undefined for strings which are not translatable', () => {
    nonTranslatableStrings.forEach((s) => {
      expect(getTranslationKey(s)).toBe(undefined);
    });
  });
});

describe('getNamespacesFromExtensions', () => {
  it('extracts unique namespaces from translatable strings across extensions', () => {
    const extensions: Extension[] = [
      {
        type: 'Nav/Item',
        properties: { name: '%plugin__acm~Home%', section: '%plugin__acm~Overview%' },
      },
      {
        type: 'Nav/Item',
        properties: { name: '%plugin__mce~Clusters%' },
      },
    ];
    expect(getNamespacesFromExtensions(extensions).sort()).toEqual(['plugin__acm', 'plugin__mce']);
  });

  it('returns an empty array when no translatable strings have namespaces', () => {
    const extensions: Extension[] = [
      { type: 'Foo/Bar', properties: { name: '%keyWithoutNs%' } },
      { type: 'Foo/Bar', properties: { name: 'plain string' } },
    ];
    expect(getNamespacesFromExtensions(extensions)).toEqual([]);
  });

  it('returns an empty array for extensions with no translatable strings', () => {
    const extensions: Extension[] = [{ type: 'Foo/Bar', properties: { count: 42, flag: true } }];
    expect(getNamespacesFromExtensions(extensions)).toEqual([]);
  });

  it('deduplicates namespaces across multiple extensions', () => {
    const extensions: Extension[] = [
      { type: 'Nav/Item', properties: { name: '%plugin__acm~Home%' } },
      { type: 'Nav/Item', properties: { name: '%plugin__acm~Overview%' } },
      { type: 'Nav/Item', properties: { name: '%plugin__acm~Search%' } },
    ];
    expect(getNamespacesFromExtensions(extensions)).toEqual(['plugin__acm']);
  });
});

describe('translateExtension', () => {
  it("recursively replaces all translatable string values via the 't' function", () => {
    const testExtension: Extension = {
      type: 'Foo/Bar',
      properties: {
        foo1: '%test~1%',
        foo2: '%test~2',
        bar: ['%test~3%', 'test~4%', '%test~5%'],
        baz: {
          qux1: '%test~6%',
          qux2: 'test~7',
          mux: { boom: ['%test~8%', '%%'] },
        },
      },
    };

    const mockFn = jest.fn((key) => `translated: ${key}`);
    const t = mockFn;

    expect(translateExtension(testExtension, t)).toEqual({
      type: 'Foo/Bar',
      properties: {
        foo1: 'translated: %test~1%',
        foo2: '%test~2',
        bar: ['translated: %test~3%', 'test~4%', 'translated: %test~5%'],
        baz: {
          qux1: 'translated: %test~6%',
          qux2: 'test~7',
          mux: { boom: ['translated: %test~8%', '%%'] },
        },
      },
    });

    expect(mockFn.mock.calls.length).toBe(5);
    expect(mockFn.mock.calls).toEqual([
      ['%test~1%'],
      ['%test~3%'],
      ['%test~5%'],
      ['%test~6%'],
      ['%test~8%'],
    ]);
  });

  it('returns a cloned extension instance', () => {
    const testExtension: Extension = { type: 'Foo/Bar', properties: {} };
    const mockFn = jest.fn((key) => key);
    const t = mockFn;

    expect(translateExtension(testExtension, t)).not.toBe(testExtension);
    expect(mockFn).not.toHaveBeenCalled();
  });
});
