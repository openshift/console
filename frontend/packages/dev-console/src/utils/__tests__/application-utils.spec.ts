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
import { ServiceModel as KnativeServiceModel } from '@console/knative-plugin';
import * as utils from '@console/internal/components/utils';
import { TopologyDataResources } from '../../components/topology/topology-types';
import { getTopologyResourceObject } from '../../components/topology/topology-utils';
import { transformTopologyData } from '../../components/topology/data-transforms/data-transformer';
import { cleanUpWorkload } from '../application-utils';
import { MockResources } from '../../components/topology/__tests__/topology-test-data';
import { MockKnativeResources } from '../../components/topology/__tests__/topology-knative-test-data';

import Spy = jasmine.Spy;

const spyAndReturn = (spy: Spy) => (returnValue: any) =>
  new Promise((resolve) =>
    spy.and.callFake((...args) => {
      resolve(args);
      return returnValue;
    }),
  );
const getTopologyData = (
  mockData: TopologyDataResources,
  transformByProp: string[],
  name: string,
) => {
  const result = transformTopologyData(mockData, transformByProp);
  const topologyTransformedData = result.topology;
  const keys = Object.keys(topologyTransformedData);
  const itemKey = keys.find((key) => result.topology[key].resources.obj.metadata.name === name);
  const resource = getTopologyResourceObject(result.topology[itemKey]);
  return { resource, topologyTransformedData: result.topology[itemKey] };
};
describe('ApplicationUtils ', () => {
  let spy;
  let checkAccessSpy;
  beforeEach(() => {
    spy = spyOn(k8s, 'k8sKill');
    checkAccessSpy = spyOn(utils, 'checkAccess');
    spyAndReturn(spy)(Promise.resolve({}));
    spyAndReturn(checkAccessSpy)(Promise.resolve({ status: { allowed: true } }));
  });

  it('Should delete all the specific models related to deployment config', (done) => {
    const { resource, topologyTransformedData } = getTopologyData(
      MockResources,
      ['deploymentConfigs'],
      'nodejs',
    );

    cleanUpWorkload(resource, topologyTransformedData)
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

  it('Should delete all the specific models related to deployment config if the build config is not present i.e. for resource created through deploy image form', (done) => {
    const { resource, topologyTransformedData } = getTopologyData(
      MockResources,
      ['deploymentConfigs'],
      'nodejs-ex',
    );

    cleanUpWorkload(resource, topologyTransformedData)
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

  it('Should delete all the specific models related to knative deployments if the build config is not present i.e. for resource created through deploy image form', (done) => {
    const { resource, topologyTransformedData } = getTopologyData(
      MockKnativeResources,
      ['deployments'],
      'overlayimage',
    );
    cleanUpWorkload(resource, topologyTransformedData)
      .then(() => {
        const allArgs = spy.calls.allArgs();
        const removedModels = allArgs.map((arg) => arg[0]);
        expect(spy.calls.count()).toEqual(2);
        expect(removedModels).toContain(KnativeServiceModel);
        expect(removedModels).toContain(ImageStreamModel);
        done();
      })
      .catch((err) => fail(err));
  });

  it('Should delete all the specific models related to daemonsets', (done) => {
    const { resource, topologyTransformedData } = getTopologyData(
      MockResources,
      ['daemonSets'],
      'daemonset-testing',
    );
    cleanUpWorkload(resource, topologyTransformedData)
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

  it('Should delete all the specific models related to statefulsets', (done) => {
    const { resource, topologyTransformedData } = getTopologyData(
      MockResources,
      ['statefulSets'],
      'alertmanager-main',
    );
    cleanUpWorkload(resource, topologyTransformedData)
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
  it('Should not delete any of the models, if delete access is not available', (done) => {
    const { resource, topologyTransformedData } = getTopologyData(
      MockResources,
      ['deploymentConfigs'],
      'nodejs',
    );
    spyAndReturn(checkAccessSpy)(Promise.resolve({ status: { allowed: false } }));
    cleanUpWorkload(resource, topologyTransformedData)
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
