import { coFetchJSON } from '@console/shared/src/utils/console-fetch';
import type { OperatorMigrationScan } from '../operator-migration-api';
import {
  getOperatorMigrationScans,
  invalidateOperatorMigrationScans,
} from '../operator-migration-api';

jest.mock('@console/shared/src/utils/console-fetch', () => ({ coFetchJSON: jest.fn() }));

const fetchJSONMock = jest.mocked(coFetchJSON);

const pendingScan = () => {
  let resolve: (scans: OperatorMigrationScan[]) => void;
  let reject: (error: Error) => void;
  const promise = new Promise<OperatorMigrationScan[]>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

const scan = (name: string): OperatorMigrationScan[] => [
  {
    subscriptionName: name,
    subscriptionNamespace: 'operators',
    status: 'Eligible',
    eligible: true,
    reason: '',
  },
];

describe('operator migration scan cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidateOperatorMigrationScans();
  });

  it('shares a pending request and caches its result', async () => {
    const request = pendingScan();
    fetchJSONMock.mockReturnValue(request.promise);
    const first = getOperatorMigrationScans();
    expect(getOperatorMigrationScans()).toBe(first);

    request.resolve(scan('current'));

    await expect(first).resolves.toEqual(scan('current'));
    await expect(getOperatorMigrationScans()).resolves.toEqual(scan('current'));
    expect(coFetchJSON).toHaveBeenCalledTimes(1);
  });

  it('does not repopulate an invalidated cache when the old request succeeds', async () => {
    const oldRequest = pendingScan();
    fetchJSONMock.mockReturnValueOnce(oldRequest.promise);
    const old = getOperatorMigrationScans();
    invalidateOperatorMigrationScans();

    oldRequest.resolve(scan('old'));
    await expect(old).resolves.toEqual(scan('old'));
    fetchJSONMock.mockResolvedValueOnce(scan('fresh'));

    await expect(getOperatorMigrationScans()).resolves.toEqual(scan('fresh'));
    expect(coFetchJSON).toHaveBeenCalledTimes(2);
  });

  it('does not replace a newer result with an older successful response', async () => {
    const oldRequest = pendingScan();
    fetchJSONMock.mockReturnValueOnce(oldRequest.promise).mockResolvedValueOnce(scan('fresh'));
    const old = getOperatorMigrationScans();
    invalidateOperatorMigrationScans();
    await expect(getOperatorMigrationScans()).resolves.toEqual(scan('fresh'));

    oldRequest.resolve(scan('old'));
    await expect(old).resolves.toEqual(scan('old'));

    await expect(getOperatorMigrationScans()).resolves.toEqual(scan('fresh'));
    expect(coFetchJSON).toHaveBeenCalledTimes(2);
  });

  it('preserves the newer pending request when an invalidated request fails', async () => {
    const oldRequest = pendingScan();
    const newRequest = pendingScan();
    fetchJSONMock.mockReturnValueOnce(oldRequest.promise).mockReturnValueOnce(newRequest.promise);
    const old = getOperatorMigrationScans();
    invalidateOperatorMigrationScans();
    const current = getOperatorMigrationScans();
    const failure = new Error('Old request failed');

    oldRequest.reject(failure);
    await expect(old).rejects.toBe(failure);

    expect(getOperatorMigrationScans()).toBe(current);
    newRequest.resolve(scan('fresh'));
    await expect(current).resolves.toEqual(scan('fresh'));
    expect(coFetchJSON).toHaveBeenCalledTimes(2);
  });

  it('does not cache an error after invalidation', async () => {
    const oldRequest = pendingScan();
    fetchJSONMock.mockReturnValueOnce(oldRequest.promise);
    const old = getOperatorMigrationScans();
    invalidateOperatorMigrationScans();
    const failure = new Error('Old request failed');

    oldRequest.reject(failure);
    await expect(old).rejects.toBe(failure);
    fetchJSONMock.mockResolvedValueOnce(scan('fresh'));

    await expect(getOperatorMigrationScans()).resolves.toEqual(scan('fresh'));
    expect(coFetchJSON).toHaveBeenCalledTimes(2);
  });
});
