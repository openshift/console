import { testHook } from '../../../../../__tests__/utils/hooks-utils';
import useTranslationExt from '../useTranslationExt';

describe('useTranslationExt', () => {
  it('should return the input if key does not match translation pattern', () => {
    testHook(() => {
      const { t: translate } = useTranslationExt();
      expect(translate('%')).toBe('%');
      expect(translate('a%')).toBe('a%');
      expect(translate('%a')).toBe('%a');
      expect(translate('%%')).toBe('%%');
      expect(translate('foo')).toBe('foo');
    });
  });

  it('should parse as a translation key', () => {
    testHook(() => {
      const { t: translate } = useTranslationExt();
      expect(translate('%test~key%')).toBe('key');
    });
  });
});
