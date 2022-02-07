import { Model } from '@patternfly/react-topology';
import * as utils from '@console/internal/components/utils/rbac';
import { DeploymentConfigModel, DaemonSetModel, StatefulSetModel } from '@console/internal/models';
import * as k8s from '@console/internal/module/k8s';
import { ServiceModel as KnativeServiceModel } from '@console/knative-plugin/src/models';
import { MockKnativeResources } from '@console/knative-plugin/src/topology/__tests__/topology-knative-test-data';
import { getKnativeTopologyDataModel } from '@console/knative-plugin/src/topology/data-transformer';
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

const spyAndReturn = (spy: jest.Mock) => (returnValue: any) =>
  new Promise((resolve) =>
    spy.mockImplementation((...args) => {
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
    model = await getKnativeTopologyDataModel(namespace, mockData);
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
    spy = jest.spyOn(k8s, 'k8sKill');
    checkAccessSpy = jest.spyOn(utils, 'checkAccess');
    spyK8sGet = jest.spyOn(k8s, 'k8sGet');
    spyAndReturn(spy)(Promise.resolve({}));
    spyAndReturn(checkAccessSpy)(Promise.resolve({ status: { allowed: true } }));
    spyAndReturn(spyK8sGet)(Promise.resolve(true));
    jest.spyOn(k8s, 'k8sList').mockImplementation((model) => {
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
    spy.mockRestore();
    checkAccessSpy.mockRestore();
    spyK8sGet.mockRestore();
  });

  it('Should delete all the specific models related to deployment config', async (done) => {
    const nodeModel = await getTopologyData(MockResources, 'nodejs', 'test-project');
    mockBuilds = sampleBuilds.data;
    mockBuildConfigs = sampleBuildConfigs.data;
    mockSecrets = sampleSecrets;
    cleanUpWorkload(nodeModel.resource, false)
      .then(() => {
        const removedModels = spy.mock.calls[0][0];
        expect(spy).toHaveBeenCalledTimes(6);
        expect(removedModels).toEqual(DeploymentConfigModel);
        // jest doesn't seem to support this behavior check like Jasmine Did
        // expect(removedModels).toContain(ImageStreamModel);
        // expect(removedModels).toContain(ServiceModel);
        // expect(removedModels).toContain(RouteModel);
        // expect(removedModels).toContain(BuildConfigModel);
        // expect(removedModels.filter((model) => model.kind === 'Secret')).toHaveLength(1);
        done();
      })
      .catch((err) => fail(err));
  });

  it('Should delete all the specific models related to deployment config if the build config is not present i.e. for resource created through deploy image form', async (done) => {
    const nodeModel = await getTopologyData(MockResources, 'nodejs-ex', 'test-project');

    cleanUpWorkload(nodeModel.resource, false)
      .then(() => {
        const removedModels = spy.mock.calls[0][0];
        expect(spy).toHaveBeenCalledTimes(4);
        expect(removedModels).toEqual(DeploymentConfigModel);

        // jest doesn't seem to support this behavior check like Jasmine did
        // expect(removedModels).toContain(ImageStreamModel);
        // expect(removedModels).toContain(ServiceModel);
        // expect(removedModels).toContain(RouteModel);
        done();
      })
      .catch((err) => fail(err));
  });

  it('Should delete all the specific models related to daemonsets', async (done) => {
    const nodeModel = await getTopologyData(MockResources, 'daemonset-testing', 'test-project');
    cleanUpWorkload(nodeModel.resource, false)
      .then(() => {
        const removedModels = spy.mock.calls[0][0];
        expect(spy).toHaveBeenCalledTimes(1);
        expect(removedModels).toEqual(DaemonSetModel);
        done();
      })
      .catch((err) => fail(err));
  });

  it('Should delete all the specific models related to statefulsets', async (done) => {
    const nodeModel = await getTopologyData(MockResources, 'alertmanager-main', 'test-project');
    cleanUpWorkload(nodeModel.resource, false)
      .then(() => {
        const removedModels = spy.mock.calls[0][0];
        expect(spy).toHaveBeenCalledTimes(1);
        expect(removedModels).toEqual(StatefulSetModel);
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
    cleanUpWorkload(nodeModel.resource, true)
      .then(() => {
        const removedModels = spy.mock.calls[0][0];
        expect(spy).toHaveBeenCalledTimes(2);
        expect(removedModels).toEqual(KnativeServiceModel);
        // jest doesn't seem to support this behavior like Jasmine did
        // expect(removedModels.filter((model) => model.kind === 'Secret')).toHaveLength(0);
        done();
      })
      .catch((err) => fail(err));
  });

  it('Should not delete any of the models, if delete access is not available', async (done) => {
    const nodeModel = await getTopologyData(MockResources, 'nodejs', 'test-project');
    spyAndReturn(checkAccessSpy)(Promise.resolve({ status: { allowed: false } }));
    cleanUpWorkload(nodeModel.resource, false)
      .then(() => {
        const removedModels = spy.mock.calls;
        expect(spy).toHaveBeenCalledTimes(0);
        expect(removedModels).toHaveLength(0);
        done();
      })
      .catch((err) => fail(err));
  });
});
