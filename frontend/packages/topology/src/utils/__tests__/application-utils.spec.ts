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

const getTopologyData = (mockData: TopologyDataResources, name: string): OdcNodeModel => {
  const model = { nodes: [], edges: [] };
  const workloadResources = getWorkloadResources(mockData, TEST_KINDS_MAP, WORKLOAD_TYPES);
  const result = baseDataModelGetter(model, 'test-project', mockData, workloadResources, []);

  return result.nodes.find((n) => n.data.resources.obj.metadata.name === name);
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
    const nodeModel = await getTopologyData(MockResources, 'nodejs');
    mockBuilds = sampleBuilds.data;
    mockBuildConfigs = sampleBuildConfigs.data;
    mockSecrets = sampleSecrets;
    cleanUpWorkload(nodeModel.resource, false)
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
    const nodeModel = await getTopologyData(MockResources, 'nodejs-ex');

    cleanUpWorkload(nodeModel.resource, false)
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

  it('Should delete all the specific models related to daemonsets', async (done) => {
    const nodeModel = await getTopologyData(MockResources, 'daemonset-testing');
    cleanUpWorkload(nodeModel.resource, false)
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
    const nodeModel = await getTopologyData(MockResources, 'alertmanager-main');
    cleanUpWorkload(nodeModel.resource, false)
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
  it('Should not delete any of the models, if delete access is not available', async (done) => {
    const nodeModel = await getTopologyData(MockResources, 'nodejs');
    spyAndReturn(checkAccessSpy)(Promise.resolve({ status: { allowed: false } }));
    cleanUpWorkload(nodeModel.resource, false)
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
