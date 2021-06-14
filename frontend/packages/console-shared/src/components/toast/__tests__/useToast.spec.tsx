import { testHook } from '../../../../../../__tests__/utils/hooks-utils';
import ToastProvider from '../ToastProvider';
import useToast from '../useToast';

describe('useToast', () => {
  it('should provide a context', () => {
    let toastContext;
    testHook(
      () => {
        toastContext = useToast();
      },
      { wrappingComponent: ToastProvider },
    );
    expect(typeof toastContext.addToast).toBe('function');
    expect(typeof toastContext.removeToast).toBe('function');
  });
});
