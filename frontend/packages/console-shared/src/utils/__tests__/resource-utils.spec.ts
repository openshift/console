import * as _ from 'lodash';
import {
  MockResources,
  sampleDeploymentConfigs,
  sampleDeployments,
  sampleStatefulSets,
  sampleDaemonSets,
} from '@console/dev-console/src/components/topology/__tests__/topology-test-data';
import {
  getKnativeServingRevisions,
  getKnativeServingConfigurations,
  getKnativeServingRoutes,
} from '@console/knative-plugin/src/utils/get-knative-resources';
import {
  sampleKnativeDeployments,
  MockKnativeResources,
} from '@console/dev-console/src/components/topology/__tests__/topology-knative-test-data';
import { TransformResourceData } from '../transformResourceData';

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveProperties(a: string[]): R;
    }
  }
}

expect.extend({
  toHaveProperties(received, argument) {
    const pass = argument.every((arg: string) => {
      return _.has(received, arg);
    });
    if (pass) {
      return {
        message: () =>
          `expected  ${this.utils.printReceived(
            received,
          )} to contain Keys ${this.utils.printExpected(argument)}`,
        pass: true,
      };
    }
    return {
      message: () =>
        `expected ${this.utils.printReceived(received)} to contain Keys ${this.utils.printExpected(
          argument,
        )} but got ${this.utils.printExpected(Object.keys(received))}`,
      pass: false,
    };
  },
});

enum Keys {
  ALERTS = 'alerts',
  BC = 'buildConfigs',
  CURRENT = 'current',
  ROLLINGOUT = 'isRollingOut',
  OBJ = 'obj',
  PODS = 'pods',
  PREVIOUS = 'previous',
  ROUTES = 'routes',
  STATUS = 'status',
  SERVICE = 'services',
  REVISIONS = 'revisions',
  KNATIVECONFIGS = 'configurations',
  KSROUTES = 'ksroutes',
}

const podKeys = [Keys.ALERTS, Keys.OBJ, Keys.ROUTES, Keys.SERVICE, Keys.STATUS];
const dsAndSSKeys = [...podKeys, Keys.BC, Keys.PODS];
const dcKeys = [...dsAndSSKeys, Keys.CURRENT, Keys.ROLLINGOUT, Keys.PREVIOUS];
const knativeKeys = [...dcKeys, Keys.REVISIONS, Keys.KNATIVECONFIGS, Keys.KSROUTES];
const podRCKeys = [Keys.OBJ, Keys.CURRENT, Keys.PREVIOUS, Keys.PODS, Keys.ROLLINGOUT];

describe('TransformResourceData', () => {
  let transformResourceData;
  beforeEach(() => {
    transformResourceData = new TransformResourceData(MockResources, [
      getKnativeServingRevisions,
      getKnativeServingConfigurations,
      getKnativeServingRoutes,
    ]);
  });
  it('should create Deployment config Items for a provided dc', () => {
    const transformedData = transformResourceData.createDeploymentConfigItems(
      sampleDeploymentConfigs.data,
    );
    expect(transformedData).toHaveLength(1);
    expect(transformedData[0]).toHaveProperties(dcKeys);
  });

  it('should only have keys mentions in dcKeys for created Deployment config Items for a provided dc', () => {
    const transformedData = transformResourceData.createDeploymentConfigItems(
      sampleDeploymentConfigs.data,
    );
    expect(transformedData).toHaveLength(1);
    expect(transformedData[0]).not.toHaveProperties([...dcKeys, 'revisions']);
  });

  it('should create Deployment Items for a provided deployment', () => {
    const transformedData = transformResourceData.createDeploymentItems(sampleDeployments.data);
    expect(transformedData).toHaveLength(3);
    expect(transformedData[0]).toHaveProperties(dcKeys);
    expect(transformedData[1]).toHaveProperties(dcKeys);
  });

  it('should create Knative Deployment Items for a provided deployment', () => {
    const transformKnativeResourceData = new TransformResourceData(MockKnativeResources, [
      getKnativeServingRevisions,
      getKnativeServingConfigurations,
      getKnativeServingRoutes,
    ]);
    const transformedData = transformKnativeResourceData.createDeploymentItems(
      sampleKnativeDeployments.data,
    );
    expect(transformedData).toHaveLength(1);
    expect(transformedData[0]).toHaveProperties(knativeKeys);
  });

  it('should only have keys mentions in KnativeKeys for created Deployment Items for a provided deployment', () => {
    const transformedData = transformResourceData.createDeploymentItems(sampleDeployments.data);
    expect(transformedData).toHaveLength(3);
    expect(transformedData[0]).not.toHaveProperties([...knativeKeys, 'key']);
  });

  it('should create StatefulSets Items for a provided ss', () => {
    const transformedData = transformResourceData.createStatefulSetItems(sampleStatefulSets.data);
    expect(transformedData).toHaveLength(1);
    expect(transformedData[0]).toHaveProperties(dsAndSSKeys);
  });

  it('should not have rc current or previous prop for created StatefulSets Items for a provided ss', () => {
    const transformedData = transformResourceData.createStatefulSetItems(sampleStatefulSets.data);
    expect(transformedData).toHaveLength(1);
    expect(transformedData[0]).not.toHaveProperties([...dsAndSSKeys, 'previous']);
  });

  it('should create DaemonSets Items for a provided ds', () => {
    const transformedData = transformResourceData.createDaemonSetItems(sampleDaemonSets.data);
    expect(transformedData).toHaveLength(1);
    expect(transformedData[0]).toHaveProperties(dsAndSSKeys);
  });

  it('should not have rc current or previous prop for created DaemonSets Items for a provided ds', () => {
    const transformedData = transformResourceData.createDaemonSetItems(sampleDaemonSets.data);
    expect(transformedData).toHaveLength(1);
    expect(transformedData[0]).not.toHaveProperties([...dsAndSSKeys, 'current']);
  });

  it('should return pods and replication controllers for a given DeploymentConfig', () => {
    const transformedData = transformResourceData.getPodsForDeploymentConfigs(
      sampleDeploymentConfigs.data,
    );
    expect(transformedData).toHaveLength(1);
    expect(transformedData[0]).toHaveProperties(podRCKeys);
  });

  it('should return pods and replication controllers for a given DeploymentConfig', () => {
    const transformedData = transformResourceData.getPodsForDeployments(sampleDeployments.data);
    expect(transformedData).toHaveLength(3);
    expect(transformedData[0]).toHaveProperties(podRCKeys);
    expect(transformedData[1]).toHaveProperties(podRCKeys);
  });

  it('should return only pods and not replication controllers for a given resource', () => {
    const transformedData = transformResourceData.createPodItems();
    transformedData.forEach((element) => {
      expect(element).toHaveProperties(podKeys);
    });
  });

  it('should return pods and not replication controllers for a given resource', () => {
    const transformedData = transformResourceData.createPodItems();
    transformedData.forEach((element) => {
      expect(element).not.toHaveProperties([...podKeys, 'current', 'previous']);
    });
  });
});
