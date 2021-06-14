import * as _ from 'lodash';
import { ExtensibleModel } from '../ModelContext';
import { updateTopologyDataModel } from '../updateTopologyDataModel';

const namespace = 'test-project';

const MockWatchedResources = {
  deploymentConfigs: { isList: true, kind: 'DeploymentConfig', namespace, optional: true },
  deployments: { isList: true, kind: 'Deployment', namespace, optional: true },
  jobs: { isList: true, kind: 'Job', namespace, optional: true },
  pods: { isList: true, kind: 'Pod', namespace, optional: true },
  secrets: { isList: true, kind: 'Secret', namespace, optional: true },
  statefulSets: { isList: true, kind: 'StatefulSet', namespace, optional: true },
};

const mockNotReadyResources = {
  deploymentConfigs: { data: [], loaded: true, loadError: '' },
  deployments: { data: [], loaded: true, loadError: '' },
  jobs: { data: [], loaded: true, loadError: '' },
  pods: { data: [], loaded: false, loadError: '' },
  secrets: { data: [], loaded: true, loadError: '' },
  statefulSets: { data: [], loaded: true, loadError: '' },
};

const mockReadyResources = {
  deploymentConfigs: { data: [], loaded: true, loadError: '' },
  deployments: { data: [], loaded: true, loadError: '' },
  jobs: { data: [], loaded: true, loadError: '' },
  pods: { data: [], loaded: true, loadError: '' },
  secrets: { data: [], loaded: true, loadError: '' },
  statefulSets: { data: [], loaded: true, loadError: '' },
};

const mockErrorResources = {
  deploymentConfigs: { data: [], loaded: true, loadError: '' },
  deployments: { data: [], loaded: false, loadError: 'Deployments Error' },
  jobs: { data: [], loaded: true, loadError: 'Jobs Error' },
  pods: { data: [], loaded: true, loadError: '' },
  secrets: { data: [], loaded: true, loadError: '' },
  statefulSets: { data: [], loaded: true, loadError: '' },
};

const errorResourceKeys = ['deployments', 'jobs'];

describe('TopologyDataRetriever ', () => {
  let mockWatchedResources;
  let mockExtensibleModel;

  beforeEach(() => {
    mockWatchedResources = _.cloneDeep(MockWatchedResources);
    mockExtensibleModel = new ExtensibleModel(namespace);
    mockExtensibleModel.extensionsLoaded = true;
    mockExtensibleModel.watchedResources = mockWatchedResources;
  });

  it('should proceed when all data is loaded', async () => {
    const results = await updateTopologyDataModel(
      mockExtensibleModel,
      mockReadyResources,
      true,
      null,
      null,
    );
    expect(results.loaded).toBeTruthy();
    expect(results.loadError).toBeFalsy();
  });

  it('should wait for extensions to load', async () => {
    mockExtensibleModel.extensionsLoaded = false;
    const results = await updateTopologyDataModel(
      mockExtensibleModel,
      mockReadyResources,
      true,
      null,
      null,
    );
    expect(results.loaded).toBeFalsy();
    expect(results.loadError).toBeFalsy();
  });

  it('should wait for resources to be defined', async () => {
    const results = await updateTopologyDataModel(mockExtensibleModel, undefined, true, null, null);
    expect(results.loaded).toBeFalsy();
    expect(results.loadError).toBeFalsy();
  });

  it('should wait for data to load', async () => {
    const results = await updateTopologyDataModel(
      mockExtensibleModel,
      mockNotReadyResources,
      true,
      null,
      null,
    );
    expect(results.loaded).toBeFalsy();
    expect(results.loadError).toBeFalsy();
  });

  it('should proceed when optional data failed to load', async () => {
    const results = await updateTopologyDataModel(
      mockExtensibleModel,
      mockErrorResources,
      true,
      null,
      null,
    );
    expect(results.loaded).toBeTruthy();
    expect(results.loadError).toBeFalsy();
  });

  it('should set an error when required data failed to load', async () => {
    errorResourceKeys.forEach((key) => (mockWatchedResources[key].optional = false));
    mockExtensibleModel.watchedResources = mockWatchedResources;
    const results = await updateTopologyDataModel(
      mockExtensibleModel,
      mockErrorResources,
      true,
      null,
      null,
    );
    expect(results.loaded).toBeFalsy();
    expect(results.loadError).toBeTruthy();
  });
});
