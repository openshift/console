import { renderHook } from '@testing-library/react';
import useTranslationExt from '../useTranslationExt';

describe('useTranslationExt', () => {
  it('should return the input if key does not match translation pattern', () => {
    const { result } = renderHook(() => useTranslationExt());
    const { t: translate } = result.current;
    expect(translate('%')).toBe('%');
    expect(translate('a%')).toBe('a%');
    expect(translate('%a')).toBe('%a');
    expect(translate('%%')).toBe('%%');
    expect(translate('foo')).toBe('foo');
  });

  it('should parse as a translation key', () => {
    const { result } = renderHook(() => useTranslationExt());
    const { t: translate } = result.current;
    expect(translate('%test~key%')).toBe('key');
  });
});
