import { renderHook } from '@testing-library/react';
import { InternalToastProvider } from '@console/app/src/providers/toast/InternalToastProvider';
import { useToast } from '../useToast';

describe('useToast', () => {
  it('should provide a context', () => {
    const { result } = renderHook(() => useToast(), { wrapper: InternalToastProvider });
    expect(typeof result.current.addToast).toBe('function');
    expect(typeof result.current.removeToast).toBe('function');
    expect(typeof result.current.minimizeToast).toBe('function');
  });
});
