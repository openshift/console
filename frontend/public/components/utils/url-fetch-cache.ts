const inflightRequests = new Map<string, Promise<any>>();

export function dedupedFetch(url: string, fetchFn: (url: string) => Promise<any>): Promise<any> {
  const existing = inflightRequests.get(url);
  if (existing) {
    return existing;
  }
  const promise = fetchFn(url).finally(() => {
    inflightRequests.delete(url);
  });
  inflightRequests.set(url, promise);
  return promise;
}
