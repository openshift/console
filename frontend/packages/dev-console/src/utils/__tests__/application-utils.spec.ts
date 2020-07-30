import * as k8s from '@console/internal/module/k8s';
import {
  ImageStreamModel,
  ServiceModel,
  DeploymentConfigModel,
  RouteModel,
  BuildConfigModel,
  DaemonSetModel,
  StatefulSetModel,
} from '@console/internal/models';
import * as utils from '@console/internal/components/utils';
import { TopologyDataResources } from '../../components/topology/topology-types';
import { WORKLOAD_TYPES } from '../../components/topology/topology-utils';
import { cleanUpWorkload } from '../application-utils';
import {
  MockResources,
  TEST_KINDS_MAP,
} from '../../components/topology/__tests__/topology-test-data';
import {
  baseDataModelGetter,
  getWorkloadResources,
} from '../../components/topology/data-transforms';

import Spy = jasmine.Spy;

const spyAndReturn = (spy: Spy) => (returnValue: any) =>
  new Promise((resolve) =>
    spy.and.callFake((...args) => {
      resolve(args);
      return returnValue;
    }),
  );

const getTopologyData = (mockData: TopologyDataResources, name: string) => {
  const model = { nodes: [], edges: [] };
  const workloadResources = getWorkloadResources(mockData, TEST_KINDS_MAP, WORKLOAD_TYPES);
  const result = baseDataModelGetter(model, 'test-project', mockData, workloadResources, []);

  return result.nodes.find((n) => n.data.resources.obj.metadata.name === name);
};

describe('ApplicationUtils ', () => {
  let spy;
  let checkAccessSpy;
  let spyK8sGet;
  beforeEach(() => {
    spy = spyOn(k8s, 'k8sKill');
    checkAccessSpy = spyOn(utils, 'checkAccess');
    spyK8sGet = spyOn(k8s, 'k8sGet');
    spyAndReturn(spy)(Promise.resolve({}));
    spyAndReturn(checkAccessSpy)(Promise.resolve({ status: { allowed: true } }));
    spyAndReturn(spyK8sGet)(Promise.resolve(true));
  });

  it('Should delete all the specific models related to deployment config', async (done) => {
    const nodeModel = await getTopologyData(MockResources, 'nodejs');
    cleanUpWorkload(nodeModel)
      .then(() => {
        const allArgs = spy.calls.allArgs();
        const removedModels = allArgs.map((arg) => arg[0]);

        expect(spy.calls.count()).toEqual(7);
        expect(removedModels).toContain(DeploymentConfigModel);
        expect(removedModels).toContain(ImageStreamModel);
        expect(removedModels).toContain(ServiceModel);
        expect(removedModels).toContain(RouteModel);
        expect(removedModels).toContain(BuildConfigModel);
        expect(removedModels.filter((model) => model.kind === 'Secret')).toHaveLength(2);
        done();
      })
      .catch((err) => fail(err));
  });

  it('Should delete all the specific models related to deployment config if the build config is not present i.e. for resource created through deploy image form', async (done) => {
    const nodeModel = await getTopologyData(MockResources, 'nodejs-ex');

    cleanUpWorkload(nodeModel)
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
    cleanUpWorkload(nodeModel)
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
    cleanUpWorkload(nodeModel)
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
    cleanUpWorkload(nodeModel)
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
