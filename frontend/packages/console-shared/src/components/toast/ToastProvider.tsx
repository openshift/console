import type { FC, ReactNode } from 'react';
import { useState, useCallback, useMemo } from 'react';
import { Alert, AlertGroup, AlertActionCloseButton, AlertActionLink } from '@patternfly/react-core';
import type { ToastOptions, ToastContextType } from './ToastContext';
import ToastContext from './ToastContext';

interface ToastProviderProps {
  children?: ReactNode;
}

/** Stable reference to append toast alerts to the document body */
const appendTo = () => document.body;

const ToastProvider: FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastOptions[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((state) => {
      const index = state.findIndex((t) => t.id === id);
      if (index !== -1) {
        const toast = state[index];
        if (toast.onRemove) {
          toast.onRemove(toast.id);
        }
        return [...state.slice(0, index), ...state.slice(index + 1, state.length)];
      }
      return state;
    });
  }, []);

  const addToast = useMemo(() => {
    let counter = 0;
    return (toast: ToastOptions) => {
      const clone: ToastOptions = {
        id: `toast-${++counter}`,
        ...toast,
      };
      setToasts((state) => {
        const index = state.findIndex((t) => t.id === clone.id);
        if (index !== -1) {
          return [...state.slice(0, index), clone, ...state.slice(index + 1, state.length)];
        }
        return [...state, clone];
      });
      return clone.id;
    };
  }, []);

  const controller: ToastContextType = useMemo<ToastContextType>(
    () => ({
      addToast,
      removeToast,
    }),
    [addToast, removeToast],
  );

  return (
    <ToastContext.Provider value={controller}>
      {children}
      {toasts.length ? (
        <AlertGroup appendTo={appendTo} isToast>
          {toasts.map((toast) => (
            <Alert
              key={toast.id}
              isLiveRegion
              title={toast.title}
              variant={toast.variant}
              timeout={toast.timeout}
              onTimeout={() => removeToast(toast.id)}
              data-test={toast.dataTest || `${toast.title} alert`}
              actionClose={
                toast.dismissible ? (
                  <AlertActionCloseButton
                    onClose={() => {
                      toast.onClose && toast.onClose();
                      removeToast(toast.id);
                    }}
                  />
                ) : undefined
              }
              actionLinks={
                toast.actions?.length > 0 ? (
                  <>
                    {toast.actions.map((action) => (
                      <AlertActionLink
                        key={action.label}
                        onClick={() => {
                          if (action.dismiss) {
                            removeToast(toast.id);
                          }
                          action.callback();
                        }}
                        component={action.component}
                        data-test={action.dataTest || 'toast-action'}
                      >
                        {action.label}
                      </AlertActionLink>
                    ))}
                  </>
                ) : undefined
              }
            >
              {toast.content}
            </Alert>
          ))}
        </AlertGroup>
      ) : null}
    </ToastContext.Provider>
  );
};
export default ToastProvider;
