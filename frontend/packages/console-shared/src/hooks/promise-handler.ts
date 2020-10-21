import * as React from 'react';

export const usePromiseHandler: PromisHandlerHook = () => {
  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const handlePromise = (promise) => {
    setInProgress(true);
    return promise
      .then(() => setErrorMessage(''))
      .catch((reason) => setErrorMessage(reason || 'An error occurred. Please try again.'))
      .finally(() => setInProgress(false));
  };
  return [handlePromise, inProgress, errorMessage];
};

type PromiseHandlerCallback<T> = (promise: Promise<T>) => Promise<T>;
type PromisHandlerHook = <T = any>() => [PromiseHandlerCallback<T>, boolean, string];
