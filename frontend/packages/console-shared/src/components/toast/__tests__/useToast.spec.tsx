import { renderHook } from '@testing-library/react';
import ToastProvider from '../ToastProvider';
import useToast from '../useToast';

describe('useToast', () => {
  it('should provide a context', () => {
    const { result } = renderHook(() => useToast(), { wrapper: ToastProvider });
    expect(typeof result.current.addToast).toBe('function');
    expect(typeof result.current.removeToast).toBe('function');
  });
});
