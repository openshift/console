import { useState } from 'react';

export const usePromiseHandler: PromiseHandlerHook = <T extends unknown = any>() => {
  const [inProgress, setInProgress] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const handlePromise: PromiseHandlerCallback<T> = (promise) => {
    setInProgress(true);
    return promise
      .then((res) => {
        setErrorMessage('');
        return res;
      })
      .catch((error) => {
        setErrorMessage(error.toString?.() || 'An error occurred. Please try again.');
        return Promise.reject(error);
      })
      .finally(() => setInProgress(false));
  };
  return [handlePromise, inProgress, errorMessage];
};

type PromiseHandlerCallback<T> = (promise: Promise<T>) => Promise<T>;
type PromiseHandlerHook = <T>() => [PromiseHandlerCallback<T>, boolean, string];
