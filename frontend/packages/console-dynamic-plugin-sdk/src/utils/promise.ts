/**
 * Unwrap the result of `Promise.allSettled` call as `[fulfilledValues, rejectedReasons]` tuple.
 */
const unwrapPromiseSettledResults = <T = any>(results: PromiseSettledResult<T>[]): [T[], any[]] => {
  const fulfilledValues = results
    .filter((r) => r.status === 'fulfilled')
    .map((r: PromiseFulfilledResult<T>) => r.value);

  const rejectedReasons = results
    .filter((r) => r.status === 'rejected')
    .map((r: PromiseRejectedResult) => r.reason);

  return [fulfilledValues, rejectedReasons];
};

/**
 * Await `Promise.allSettled(promises)` and unwrap the resulting objects.
 *
 * `Promise.allSettled` never rejects, therefore the resulting `Promise` never rejects.
 */
export const settleAllPromises = async <T = any>(promises: Promise<T>[]) => {
  const results = await Promise.allSettled(promises);
  return unwrapPromiseSettledResults(results);
};
