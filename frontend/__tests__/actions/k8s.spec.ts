import * as sdkK8sActions from '@console/dynamic-plugin-sdk/src/app/k8s/actions/k8s';

import * as k8sActions from '../../public/actions/k8s';
import { CustomResourceDefinitionModel } from '../../public/models';
import { makeReduxID } from '../../public/components/utils';

jest.mock('@console/internal/components/utils/rbac', () => ({
  checkAccess: jest
    .fn()
    .mockReturnValueOnce(Promise.resolve({ status: { allowed: false } }))
    .mockReturnValue(Promise.resolve({ status: { allowed: true } })),
}));

describe('startAPIDiscovery', () => {
  it('falls back to polling if user cannot list CRDs', async () => {
    const dispatch = jest.fn();
    jest.useFakeTimers();
    jest.spyOn(console, 'log');
    jest.spyOn(window, 'setTimeout');
    const fn = () => {};
    jest.spyOn(k8sActions, 'getResources').mockImplementation(fn as any);
    await k8sActions.startAPIDiscovery()(dispatch);
    expect(k8sActions.getResources).toHaveBeenCalledTimes(1);
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
    jest.spyOn(sdkK8sActions, 'watchK8sList').mockImplementation((() => {}) as any);
    await k8sActions.startAPIDiscovery()(dispatch);
    expect(sdkK8sActions.watchK8sList).toHaveBeenCalledTimes(1);
    expect(sdkK8sActions.watchK8sList).toHaveBeenCalledWith(
      crdReduxID,
      {},
      CustomResourceDefinitionModel,
      expect.any(Function),
    );
    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenLastCalledWith('API discovery method: Watching');
  });
});
