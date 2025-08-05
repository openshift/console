import { testHook } from '@console/shared/src/test-utils/hooks-utils';
import ToastProvider from '../ToastProvider';
import useToast from '../useToast';

describe('useToast', () => {
  it('should provide a context', () => {
    let toastContext;
    testHook(
      () => {
        toastContext = useToast();
      },
      { wrapper: ToastProvider },
    );
    expect(typeof toastContext.addToast).toBe('function');
    expect(typeof toastContext.removeToast).toBe('function');
  });
});
