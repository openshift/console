import { Model } from '@patternfly/react-topology';
import * as utils from '@console/internal/components/utils';
import {
  ImageStreamModel,
  ServiceModel,
  DeploymentConfigModel,
  RouteModel,
  BuildConfigModel,
  DaemonSetModel,
  StatefulSetModel,
} from '@console/internal/models';
import * as k8s from '@console/internal/module/k8s';
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
import { OdcNodeModel, TopologyDataResources } from '../../topology-types';
import { cleanUpWorkload } from '../application-utils';
import { WORKLOAD_TYPES } from '../topology-utils';
import Spy = jasmine.Spy;

const spyAndReturn = (spy: Spy) => (returnValue: any) =>
  new Promise((resolve) =>
    spy.and.callFake((...args) => {
      resolve(args);
      return returnValue;
    }),
  );

const getTopologyData = async (
  mockData: TopologyDataResources,
  name: string,
  namespace: string,
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
  const result = baseDataModelGetter(model, namespace, mockData, workloadResources, []);
  return result.nodes.find((n) => n.data.resources?.obj.metadata.name === name);
};

const getTopologyDataKafkaSink = async (
  mockData: TopologyDataResources,
  name: string,
  namespace: string,
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
  const result = baseDataModelGetter(model, namespace, mockData, workloadResources, []);
  return result.nodes.find((n) => n.data.resources?.obj.metadata.name === name);
};

describe('ApplicationUtils ', () => {
  let spy;
  let checkAccessSpy;
  let spyK8sGet;
  let mockBuilds = [];
  let mockBuildConfigs = [];
  let mockSecrets = [];

  beforeEach(() => {
    spy = spyOn(k8s, 'k8sKill');
    checkAccessSpy = spyOn(utils, 'checkAccess');
    spyK8sGet = spyOn(k8s, 'k8sGet');
    spyAndReturn(spy)(Promise.resolve({}));
    spyAndReturn(checkAccessSpy)(Promise.resolve({ status: { allowed: true } }));
    spyAndReturn(spyK8sGet)(Promise.resolve(true));
    spyOn(k8s, 'k8sList').and.callFake((model) => {
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

  it('Should delete all the specific models related to deployment config', async (done) => {
    const nodeModel = await getTopologyData(MockResources, 'nodejs', 'test-project');
    mockBuilds = sampleBuilds.data;
    mockBuildConfigs = sampleBuildConfigs.data;
    mockSecrets = sampleSecrets;
    cleanUpWorkload(nodeModel.resource)
      .then(() => {
        const allArgs = spy.calls.allArgs();
        const removedModels = allArgs.map((arg) => arg[0]);

        expect(spy.calls.count()).toEqual(6);
        expect(removedModels).toContain(DeploymentConfigModel);
        expect(removedModels).toContain(ImageStreamModel);
        expect(removedModels).toContain(ServiceModel);
        expect(removedModels).toContain(RouteModel);
        expect(removedModels).toContain(BuildConfigModel);
        expect(removedModels.filter((model) => model.kind === 'Secret')).toHaveLength(1);
        done();
      })
      .catch((err) => fail(err));
  });

  it('Should delete all the specific models related to deployment config if the build config is not present i.e. for resource created through deploy image form', async (done) => {
    const nodeModel = await getTopologyData(MockResources, 'nodejs-ex', 'test-project');

    cleanUpWorkload(nodeModel.resource)
      .then(() => {
        const allArgs = spy.calls.allArgs();
        const removedModels = allArgs.map((arg) => arg[0]);

        expect(spy.calls.count()).toEqual(4);
        expect(removedModels).toContain(DeploymentConfigModel);
        expect(removedModels).toContain(ImageStreamModel);
        expect(removedModels).toContain(ServiceModel);
        expect(removedModels).toContain(RouteModel);
        done();
      })
      .catch((err) => fail(err));
  });

  it('Should delete all the specific models related to deployment config if the build config is present', async (done) => {
    const nodeModel = await getTopologyData(MockResources, 'nodejs-with-bc', 'testproject');

    cleanUpWorkload(nodeModel.resource)
      .then(() => {
        const allArgs = spy.calls.allArgs();
        const removedModels = allArgs.map((arg) => arg[0]);
        expect(spy.calls.count()).toEqual(5);
        expect(removedModels).toContain(BuildConfigModel);
        expect(removedModels).toContain(DeploymentConfigModel);
        expect(removedModels).toContain(ImageStreamModel);
        expect(removedModels).toContain(ServiceModel);
        expect(removedModels).toContain(RouteModel);
        done();
      })
      .catch((err) => fail(err));
  });

  it('Should delete all the specific models related to daemonsets', async (done) => {
    const nodeModel = await getTopologyData(MockResources, 'daemonset-testing', 'test-project');
    cleanUpWorkload(nodeModel.resource)
      .then(() => {
        const allArgs = spy.calls.allArgs();
        const removedModels = allArgs.map((arg) => arg[0]);
        expect(spy.calls.count()).toEqual(1);
        expect(removedModels).toContain(DaemonSetModel);
        expect(removedModels.filter((model) => model.kind === 'Secret')).toHaveLength(0);
        done();
      })
      .catch((err) => fail(err));
  });

  it('Should delete all the specific models related to statefulsets', async (done) => {
    const nodeModel = await getTopologyData(MockResources, 'alertmanager-main', 'test-project');
    cleanUpWorkload(nodeModel.resource)
      .then(() => {
        const allArgs = spy.calls.allArgs();
        const removedModels = allArgs.map((arg) => arg[0]);
        expect(spy.calls.count()).toEqual(1);
        expect(removedModels).toContain(StatefulSetModel);
        expect(removedModels.filter((model) => model.kind === 'Secret')).toHaveLength(0);
        done();
      })
      .catch((err) => fail(err));
  });

  it('Should delete all the specific models related to knative service', async (done) => {
    const nodeModel = await getTopologyData(
      MockKnativeResources,
      'overlayimage',
      'testproject3',
      'ksservices',
      true,
    );
    cleanUpWorkload(nodeModel.resource)
      .then(() => {
        const allArgs = spy.calls.allArgs();
        const removedModels = allArgs.map((arg) => arg[0]);
        expect(spy.calls.count()).toEqual(2);
        expect(removedModels).toContain(ImageStreamModel);
        expect(removedModels).toContain(KnativeServiceModel);
        expect(removedModels.filter((model) => model.kind === 'Secret')).toHaveLength(0);
        done();
      })
      .catch((err) => fail(err));
  });

  it('Should delete all the specific models related to kamelet binding', async (done) => {
    const nodeModel = await getTopologyData(
      MockKnativeResources,
      'overlayimage-kb',
      'testproject3',
      CamelKameletBindingModel.plural,
      true,
    );
    spyAndReturn(spyOn(k8s, 'modelFor'))(CamelKameletBindingModel);
    cleanUpWorkload(nodeModel.resource)
      .then(() => {
        const allArgs = spy.calls.allArgs();
        const removedModels = allArgs.map((arg) => arg[0]);
        expect(spy.calls.count()).toEqual(1);
        expect(removedModels).toContain(CamelKameletBindingModel);
        expect(removedModels.filter((model) => model.kind === 'Secret')).toHaveLength(0);
        done();
      })
      .catch((err) => fail(err));
  });

  it('Should delete all the specific models related to Kafka Sink', async (done) => {
    const nodeModel = await getTopologyDataKafkaSink(
      MockKnativeResources,
      'kafkasink-dummy',
      'testproject3',
      CamelKameletBindingModel.plural,
      true,
    );
    spyAndReturn(spyOn(k8s, 'modelFor'))(KafkaSinkModel);
    cleanUpWorkload(nodeModel.resource)
      .then(() => {
        const allArgs = spy.calls.allArgs();
        const removedModels = allArgs.map((arg) => arg[0]);
        expect(spy.calls.count()).toEqual(1);
        expect(removedModels).toContain(KafkaSinkModel);
        expect(removedModels.filter((model) => model.kind === 'Secret')).toHaveLength(0);
        done();
      })
      .catch((err) => fail(err));
  });

  it('Should not delete any of the models, if delete access is not available', async (done) => {
    const nodeModel = await getTopologyData(MockResources, 'nodejs', 'test-project');
    spyAndReturn(checkAccessSpy)(Promise.resolve({ status: { allowed: false } }));
    cleanUpWorkload(nodeModel.resource)
      .then(() => {
        const allArgs = spy.calls.allArgs();
        const removedModels = allArgs.map((arg) => arg[0]);
        expect(spy.calls.count()).toEqual(0);
        expect(removedModels).toHaveLength(0);
        done();
      })
      .catch((err) => fail(err));
  });
});
