import * as React from 'react';

export const usePromiseHandler: PromisHandlerHook = <T extends unknown = any>() => {
  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const handlePromise: PromiseHandlerCallback<T> = (promise) => {
    setInProgress(true);
    return promise
      .then((res) => {
        setErrorMessage('');
        return res;
      })
      .catch((reason) => {
        const error = reason || 'An error occurred. Please try again.';
        setErrorMessage(error);
        return Promise.reject(error);
      })
      .finally(() => setInProgress(false));
  };
  return [handlePromise, inProgress, errorMessage];
};

type PromiseHandlerCallback<T> = (promise: Promise<T>) => Promise<T>;
type PromisHandlerHook = <T>() => [PromiseHandlerCallback<T>, boolean, string];
