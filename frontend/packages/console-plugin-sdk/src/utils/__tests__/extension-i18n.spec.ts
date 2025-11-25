import { Extension } from '../../typings';
import { isTranslatableString, getTranslationKey, translateExtension } from '../extension-i18n';

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

    const t = jest.fn((key) => `translated: ${key}`);

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

    expect(t.mock.calls.length).toBe(5);
    expect(t.mock.calls).toEqual([
      ['%test~1%'],
      ['%test~3%'],
      ['%test~5%'],
      ['%test~6%'],
      ['%test~8%'],
    ]);
  });

  it('returns the same extension instance', () => {
    const testExtension: Extension = { type: 'Foo/Bar', properties: {} };
    const t = jest.fn<string>();

    expect(translateExtension(testExtension, t)).toBe(testExtension);
    expect(t).not.toHaveBeenCalled();
  });
});
