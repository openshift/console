import type { Model } from '@patternfly/react-topology';
import * as rbacModule from '@console/dynamic-plugin-sdk/src/app/components/utils/rbac';
import * as k8sResourceModule from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import {
  ImageStreamModel,
  ServiceModel,
  DeploymentConfigModel,
  RouteModel,
  BuildConfigModel,
  DaemonSetModel,
  StatefulSetModel,
} from '@console/internal/models';
import * as k8sModelsModule from '@console/internal/module/k8s/k8s-models';
import {
  CamelKameletBindingModel,
  KafkaSinkModel,
  ServiceModel as KnativeServiceModel,
} from '@console/knative-plugin/src/models';
import { MockKnativeResources } from '@console/knative-plugin/src/topology/__tests__/topology-knative-test-data';
import {
  getKafkaSinkKnativeTopologyData,
  getKnativeEventingTopologyDataModel,
  getKnativeKameletsTopologyDataModel,
  getKnativeServingTopologyDataModel,
} from '@console/knative-plugin/src/topology/data-transformer';
import {
  MockResources,
  sampleBuildConfigs,
  sampleBuilds,
  sampleSecrets,
} from '@console/shared/src/utils/__tests__/test-resource-data';
import { TEST_KINDS_MAP } from '../../__tests__/topology-test-data';
import { baseDataModelGetter } from '../../data-transforms/data-transformer';
import { getWorkloadResources } from '../../data-transforms/transform-utils';
import type { OdcNodeModel, TopologyDataResources } from '../../topology-types';
import { cleanUpWorkload } from '../application-utils';
import { WORKLOAD_TYPES } from '../topology-utils';

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource'),
  k8sKill: jest.fn(),
  k8sGet: jest.fn(),
  k8sList: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/app/components/utils/rbac', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/app/components/utils/rbac'),
  checkAccess: jest.fn(),
}));

jest.mock('@console/internal/module/k8s/k8s-models', () => {
  const actual = jest.requireActual('@console/internal/module/k8s/k8s-models');
  return {
    ...actual,
    modelFor: jest.fn(actual.modelFor),
  };
});

const k8sKillMock = k8sResourceModule.k8sKill as jest.Mock;
const k8sGetMock = k8sResourceModule.k8sGet as jest.Mock;
const k8sListMock = k8sResourceModule.k8sList as jest.Mock;
const checkAccessMock = rbacModule.checkAccess as jest.Mock;
const modelForMock = k8sModelsModule.modelFor as jest.Mock;

const getTopologyData = async (
  mockData: TopologyDataResources,
  name: string,
  workloadType?: string,
  isKnativeResource?: boolean,
): Promise<OdcNodeModel> => {
  let model: Model = { nodes: [], edges: [] };
  const workloadResources = getWorkloadResources(mockData, TEST_KINDS_MAP, [
    ...WORKLOAD_TYPES,
    workloadType,
  ]);
  if (isKnativeResource) {
    const [servingModel, eventingModel, kameletModel] = await Promise.all([
      getKnativeServingTopologyDataModel(name, mockData),
      getKnativeEventingTopologyDataModel(name, mockData),
      getKnativeKameletsTopologyDataModel(name, mockData),
    ]);

    model = {
      nodes: [...servingModel.nodes, ...eventingModel.nodes, ...kameletModel.nodes],
      edges: [...servingModel.edges, ...eventingModel.edges, ...kameletModel.edges],
    };
  }
  const result = baseDataModelGetter(model, mockData, workloadResources, []);
  return result.nodes.find((n) => n.data.resources?.obj.metadata.name === name);
};

const getTopologyDataKafkaSink = async (
  mockData: TopologyDataResources,
  name: string,
  workloadType?: string,
  isKnativeResource?: boolean,
): Promise<OdcNodeModel> => {
  let model: Model = { nodes: [], edges: [] };
  const workloadResources = getWorkloadResources(mockData, TEST_KINDS_MAP, [
    ...WORKLOAD_TYPES,
    workloadType,
  ]);
  if (isKnativeResource) {
    model = await getKafkaSinkKnativeTopologyData(name, mockData);
  }
  const result = baseDataModelGetter(model, mockData, workloadResources, []);
  return result.nodes.find((n) => n.data.resources?.obj.metadata.name === name);
};

describe('ApplicationUtils ', () => {
  let mockBuilds = [];
  let mockBuildConfigs = [];
  let mockSecrets = [];

  beforeEach(() => {
    k8sKillMock.mockResolvedValue({});
    checkAccessMock.mockResolvedValue({ status: { allowed: true } });
    k8sGetMock.mockResolvedValue(true);
    k8sListMock.mockImplementation((model) => {
      if (model.kind === 'Build') {
        return Promise.resolve(mockBuilds);
      }
      if (model.kind === 'BuildConfig') {
        return Promise.resolve(mockBuildConfigs);
      }
      if (model.kind === 'Secret') {
        return Promise.resolve(mockSecrets);
      }
      return Promise.resolve([]);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should delete all the specific models related to deployment config', async () => {
    const nodeModel = await getTopologyData(MockResources, 'nodejs');
    mockBuilds = sampleBuilds.data;
    mockBuildConfigs = sampleBuildConfigs.data;
    mockSecrets = sampleSecrets;
    await cleanUpWorkload(nodeModel.resource);
    const allArgs = k8sKillMock.mock.calls;
    const removedModels = allArgs.map((arg) => arg[0]);

    expect(k8sKillMock.mock.calls.length).toEqual(6);
    expect(removedModels).toContain(DeploymentConfigModel);
    expect(removedModels).toContain(ImageStreamModel);
    expect(removedModels).toContain(ServiceModel);
    expect(removedModels).toContain(RouteModel);
    expect(removedModels).toContain(BuildConfigModel);
    expect(removedModels.filter((model) => model.kind === 'Secret')).toHaveLength(1);
  });

  it('Should delete all the specific models related to deployment config if the build config is not present i.e. for resource created through deploy image form', async () => {
    const nodeModel = await getTopologyData(MockResources, 'nodejs-ex');

    await cleanUpWorkload(nodeModel.resource);
    const allArgs = k8sKillMock.mock.calls;
    const removedModels = allArgs.map((arg) => arg[0]);

    expect(k8sKillMock.mock.calls.length).toEqual(4);
    expect(removedModels).toContain(DeploymentConfigModel);
    expect(removedModels).toContain(ImageStreamModel);
    expect(removedModels).toContain(ServiceModel);
    expect(removedModels).toContain(RouteModel);
  });

  it('Should delete all the specific models related to deployment config if the build config is present', async () => {
    const nodeModel = await getTopologyData(MockResources, 'nodejs-with-bc');

    await cleanUpWorkload(nodeModel.resource);
    const allArgs = k8sKillMock.mock.calls;
    const removedModels = allArgs.map((arg) => arg[0]);
    expect(k8sKillMock.mock.calls.length).toEqual(5);
    expect(removedModels).toContain(BuildConfigModel);
    expect(removedModels).toContain(DeploymentConfigModel);
    expect(removedModels).toContain(ImageStreamModel);
    expect(removedModels).toContain(ServiceModel);
    expect(removedModels).toContain(RouteModel);
  });

  it('Should delete all the specific models related to daemonsets', async () => {
    const nodeModel = await getTopologyData(MockResources, 'daemonset-testing');
    await cleanUpWorkload(nodeModel.resource);
    const allArgs = k8sKillMock.mock.calls;
    const removedModels = allArgs.map((arg) => arg[0]);
    expect(k8sKillMock.mock.calls.length).toEqual(1);
    expect(removedModels).toContain(DaemonSetModel);
    expect(removedModels.filter((model) => model.kind === 'Secret')).toHaveLength(0);
  });

  it('Should delete all the specific models related to statefulsets', async () => {
    const nodeModel = await getTopologyData(MockResources, 'alertmanager-main');
    await cleanUpWorkload(nodeModel.resource);
    const allArgs = k8sKillMock.mock.calls;
    const removedModels = allArgs.map((arg) => arg[0]);
    expect(k8sKillMock.mock.calls.length).toEqual(1);
    expect(removedModels).toContain(StatefulSetModel);
    expect(removedModels.filter((model) => model.kind === 'Secret')).toHaveLength(0);
  });

  it('Should delete all the specific models related to knative service', async () => {
    const nodeModel = await getTopologyData(
      MockKnativeResources,
      'overlayimage',
      'ksservices',
      true,
    );
    await cleanUpWorkload(nodeModel.resource);
    const allArgs = k8sKillMock.mock.calls;
    const removedModels = allArgs.map((arg) => arg[0]);
    expect(k8sKillMock.mock.calls.length).toEqual(2);
    expect(removedModels).toContain(ImageStreamModel);
    expect(removedModels).toContain(KnativeServiceModel);
    expect(removedModels.filter((model) => model.kind === 'Secret')).toHaveLength(0);
  });

  it('Should delete all the specific models related to kamelet binding', async () => {
    const nodeModel = await getTopologyData(
      MockKnativeResources,
      'overlayimage-kb',
      CamelKameletBindingModel.plural,
      true,
    );
    modelForMock.mockReturnValue(CamelKameletBindingModel);
    await cleanUpWorkload(nodeModel.resource);
    const allArgs = k8sKillMock.mock.calls;
    const removedModels = allArgs.map((arg) => arg[0]);
    expect(k8sKillMock.mock.calls.length).toEqual(1);
    expect(removedModels).toContain(CamelKameletBindingModel);
    expect(removedModels.filter((model) => model.kind === 'Secret')).toHaveLength(0);
  });

  it('Should delete all the specific models related to Kafka Sink', async () => {
    const nodeModel = await getTopologyDataKafkaSink(
      MockKnativeResources,
      'kafkasink-dummy',
      CamelKameletBindingModel.plural,
      true,
    );
    modelForMock.mockReturnValue(KafkaSinkModel);
    await cleanUpWorkload(nodeModel.resource);
    const allArgs = k8sKillMock.mock.calls;
    const removedModels = allArgs.map((arg) => arg[0]);
    expect(k8sKillMock.mock.calls.length).toEqual(1);
    expect(removedModels).toContain(KafkaSinkModel);
    expect(removedModels.filter((model) => model.kind === 'Secret')).toHaveLength(0);
  });

  it('Should not delete any of the models, if delete access is not available', async () => {
    const nodeModel = await getTopologyData(MockResources, 'nodejs');
    checkAccessMock.mockResolvedValue({ status: { allowed: false } });
    await cleanUpWorkload(nodeModel.resource);
    const allArgs = k8sKillMock.mock.calls;
    const removedModels = allArgs.map((arg) => arg[0]);
    expect(k8sKillMock.mock.calls.length).toEqual(0);
    expect(removedModels).toHaveLength(0);
  });
});
