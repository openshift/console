/**
 * Unwrap the result of `Promise.allSettled` call as `[fulfilledValues, rejectedReasons]` tuple.
 */
export const unwrapPromiseSettledResults = <T = any>(
  results: PromiseSettledResult<T>[],
): [T[], any[]] => {
  const fulfilledValues = results
    .filter((r) => r.status === 'fulfilled')
    .map((r: PromiseFulfilledResult<T>) => r.value);

  const rejectedReasons = results
    .filter((r) => r.status === 'rejected')
    .map((r: PromiseRejectedResult) => r.reason);

  return [fulfilledValues, rejectedReasons];
};
