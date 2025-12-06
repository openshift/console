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

jest.mock('../k8s', () => {
  const actual = jest.requireActual('../k8s');
  return {
    ...actual,
    getResources: jest.fn(),
  };
});

jest.mock('@console/dynamic-plugin-sdk/src/app/k8s/actions/k8s', () => {
  const actual = jest.requireActual('@console/dynamic-plugin-sdk/src/app/k8s/actions/k8s');
  return {
    ...actual,
    watchK8sList: jest.fn(),
  };
});

const getResourcesMock = k8sActions.getResources as jest.Mock;
const watchK8sListMock = sdkK8sActions.watchK8sList as jest.Mock;

describe('startAPIDiscovery', () => {
  it('falls back to polling if user cannot list CRDs', async () => {
    const dispatch = jest.fn();
    jest.useFakeTimers();
    jest.spyOn(console, 'log');
    getResourcesMock.mockImplementation(() => {});
    await k8sActions.startAPIDiscovery()(dispatch);
    expect(getResourcesMock).toHaveBeenCalledTimes(1);
    expect(window.setTimeout).toHaveBeenCalledTimes(1);
    expect(window.setTimeout).toHaveBeenCalledWith(
      expect.any(Function),
      k8sActions.API_DISCOVERY_POLL_INTERVAL,
    );
    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenLastCalledWith('API discovery method: Polling');
  });

  it('uses watchK8sList when user can list CRDs', async () => {
    const crdReduxID = makeReduxID(CustomResourceDefinitionModel, {});
    const dispatch = jest.fn();
    jest.spyOn(console, 'log');
    watchK8sListMock.mockImplementation(() => {});
    await k8sActions.startAPIDiscovery()(dispatch);
    expect(watchK8sListMock).toHaveBeenCalledTimes(1);
    expect(watchK8sListMock).toHaveBeenCalledWith(
      crdReduxID,
      {},
      CustomResourceDefinitionModel,
      expect.any(Function),
    );
    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenLastCalledWith('API discovery method: Watching');
  });
});
