import type { K8sModel } from '../../../api/common-types';
import * as coFetchModule from '../../fetch/console-fetch';
import { k8sGet, k8sList, k8sGetResource } from '../k8s-resource';

jest.mock('../../fetch/console-fetch', () => ({
  ...jest.requireActual('../../fetch/console-fetch'),
  consoleFetchJSON: jest.fn(),
}));

const spyCoFetchJSON = jest.mocked(coFetchModule.consoleFetchJSON);

describe('k8s-Resource', () => {
  const MockPodModel: K8sModel = {
    apiVersion: 'v1',
    label: 'Pod',
    plural: 'pods',
    abbr: 'P',
    namespaced: true,
    kind: 'Pod',
    id: 'pod',
    labelPlural: 'Pods',
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('k8sGet should call consoleFetchJSON', async () => {
    spyCoFetchJSON.mockReturnValueOnce(Promise.resolve({}));
    await k8sGet(MockPodModel, 'my-pod');
    expect(spyCoFetchJSON).toHaveBeenCalled();
    expect(spyCoFetchJSON).toHaveBeenCalledTimes(1);
  });

  it('k8sList should call consoleFetchJSON once with proper arguments', async () => {
    spyCoFetchJSON.mockReturnValueOnce(Promise.resolve({}));
    await k8sList(MockPodModel, { ns: 'my-app' });
    expect(spyCoFetchJSON).toHaveBeenCalled();
    expect(spyCoFetchJSON).toHaveBeenCalledTimes(1);
    expect(spyCoFetchJSON).toHaveBeenCalledWith(
      '/api/kubernetes/api/v1/namespaces/my-app/pods?',
      'GET',
      {},
      null,
    );
  });

  it('k8sList should call consoleFetchJSON once with proper arguments', async () => {
    spyCoFetchJSON.mockReturnValueOnce(Promise.resolve({}));
    await k8sList(MockPodModel);
    expect(spyCoFetchJSON).toHaveBeenCalled();
    expect(spyCoFetchJSON).toHaveBeenCalledTimes(1);
    expect(spyCoFetchJSON).toHaveBeenCalledWith('/api/kubernetes/api/v1/pods?', 'GET', {}, null);
  });

  it('k8sGetResource should call consoleFetchJSON', async () => {
    spyCoFetchJSON.mockReturnValueOnce(Promise.resolve({ kind: 'Pod' }));
    const result = await k8sGetResource({ model: MockPodModel, name: 'my-pod' });
    expect(spyCoFetchJSON).toHaveBeenCalled();
    expect(spyCoFetchJSON).toHaveBeenCalledTimes(1);
    expect(result.kind).toBeDefined();
  });
});
