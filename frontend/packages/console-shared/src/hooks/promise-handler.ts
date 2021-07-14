import * as React from 'react';

export const usePromiseHandler: PromiseHandlerHook = <T extends unknown = any>() => {
  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
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

// The promise returned by Promise.allSettled() never rejects; no need for catch-or-return.
// consumer is expected to parse results and setErrorMessages accordingly
export const usePromisesAllSettledHandler: PromisesAllSettledHandlerHook = <T>() => {
  const [inProgress, setInProgress] = React.useState(false);
  const [resolved, setResolved] = React.useState(false);
  const handlePromises: PromisesAllSettledHandlerCallback<T> = (promises) => {
    setInProgress(true);
    return Promise.allSettled(promises)
      .then((res) => {
        setResolved(true);
        return res;
      })
      .finally(() => setInProgress(false));
  };
  return [handlePromises, inProgress, resolved];
};
type PromiseHandlerCallback<T> = (promise: Promise<T>) => Promise<T>;
type PromiseHandlerHook = <T>() => [PromiseHandlerCallback<T>, boolean, string];
type PromisesAllSettledHandlerCallback<T> = (
  promises: Promise<T>[],
) => Promise<PromiseSettledResult<T>[]>;
type PromisesAllSettledHandlerHook = <T>() => [
  PromisesAllSettledHandlerCallback<T>,
  boolean,
  boolean,
];
