import { testHook } from '../../../../../__tests__/utils/hooks-utils';
import useTranslationExt from '../useTranslationExt';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => `translated: ${key}` }),
  };
});

describe('useTranslationExt', () => {
  it('should return the input if key does not match translation pattern', () => {
    testHook(() => {
      const { t } = useTranslationExt();
      expect(t('%')).toBe('%');
      expect(t('a%')).toBe('a%');
      expect(t('%a')).toBe('%a');
      expect(t('%%')).toBe('%%');
      expect(t('foo')).toBe('foo');
    });
  });

  it('should parse as a translation key', () => {
    testHook(() => {
      const { t } = useTranslationExt();
      const key = '%test~key%';
      expect(t(key)).toBe(`translated: ${key.substr(1, key.length - 2)}`);
    });
  });
});
