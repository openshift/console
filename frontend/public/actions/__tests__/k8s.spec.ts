import * as sdkK8sActions from '@console/dynamic-plugin-sdk/src/app/k8s/actions/k8s';

import * as k8sActions from '../k8s';
import { CustomResourceDefinitionModel } from '../../models';
import { makeReduxID } from '../../components/utils';

jest.mock('@console/internal/components/utils/rbac', () => ({
  checkAccess: jest
    .fn()
    .mockReturnValueOnce(Promise.resolve({ status: { allowed: false } }))
    .mockReturnValue(Promise.resolve({ status: { allowed: true } })),
}));

// Mock getResources_ to avoid actual API calls
jest.mock('../../module/k8s/get-resources', () => ({
  ...jest.requireActual('../../module/k8s/get-resources'),
  getResources_: jest.fn().mockResolvedValue([]),
}));

jest.mock('@console/dynamic-plugin-sdk/src/app/k8s/actions/k8s', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/app/k8s/actions/k8s'),
  watchK8sList: jest.fn(),
}));

const watchK8sListMock = sdkK8sActions.watchK8sList as jest.Mock;

describe('startAPIDiscovery', () => {
  let setTimeoutSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('falls back to polling if user cannot list CRDs', async () => {
    const dispatch = jest.fn();
    await k8sActions.startAPIDiscovery()(dispatch);

    // Verify dispatch was called (getResources is called internally and dispatches)
    expect(dispatch).toHaveBeenCalled();

    // Verify polling was scheduled
    expect(setTimeoutSpy).toHaveBeenCalledWith(
      expect.any(Function),
      k8sActions.API_DISCOVERY_POLL_INTERVAL,
    );

    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenCalledWith('API discovery method: Polling');
  });

  it('uses watchK8sList when user can list CRDs', async () => {
    const crdReduxID = makeReduxID(CustomResourceDefinitionModel, {});
    const dispatch = jest.fn();
    watchK8sListMock.mockImplementation(() => () => {});
    await k8sActions.startAPIDiscovery()(dispatch);
    expect(watchK8sListMock).toHaveBeenCalledTimes(1);
    expect(watchK8sListMock).toHaveBeenCalledWith(
      crdReduxID,
      {},
      CustomResourceDefinitionModel,
      expect.any(Function),
    );
    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenCalledWith('API discovery method: Watching');
  });
});
