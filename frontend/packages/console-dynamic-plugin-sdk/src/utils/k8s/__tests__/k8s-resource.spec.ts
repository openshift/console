import { K8sModel } from '../../../api/common-types';
import * as k8sUtil from '../../fetch';
import { k8sGet, k8sList, k8sGetResource } from '../k8s-resource';

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
  let spyCoFetchJSON;

  beforeEach(() => {
    spyCoFetchJSON = jest.spyOn(k8sUtil, 'consoleFetchJSON');
  });

  afterEach(() => {
    jest.resetAllMocks();
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
      undefined,
    );
  });

  it('k8sList should call consoleFetchJSON once with proper arguments', async () => {
    spyCoFetchJSON.mockReturnValueOnce(Promise.resolve({}));
    await k8sList(MockPodModel);
    expect(spyCoFetchJSON).toHaveBeenCalled();
    expect(spyCoFetchJSON).toHaveBeenCalledTimes(1);
    expect(spyCoFetchJSON).toHaveBeenCalledWith(
      '/api/kubernetes/api/v1/pods?',
      'GET',
      {},
      null,
      undefined,
    );
  });

  it('k8sGetResource should call consoleFetchJSON', async () => {
    spyCoFetchJSON.mockReturnValueOnce(Promise.resolve({ kind: 'Pod' }));
    const result = await k8sGetResource({ model: MockPodModel, name: 'my-pod' });
    expect(spyCoFetchJSON).toHaveBeenCalled();
    expect(spyCoFetchJSON).toHaveBeenCalledTimes(1);
    expect(result.kind).toBeDefined();
  });
});
