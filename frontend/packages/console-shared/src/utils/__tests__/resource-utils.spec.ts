import * as _ from 'lodash';
import { OverviewResourceUtil } from '@console/plugin-sdk/src';
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
  getKnativeServingServices,
} from '@console/knative-plugin/src/utils/get-knative-resources';
import {
  sampleKnativeDeployments,
  MockKnativeResources,
} from '@console/knative-plugin/src/topology/__tests__/topology-knative-test-data';
import { DaemonSetModel, StatefulSetModel } from '@console/internal/models';
import {
  createDeploymentConfigItems,
  createOverviewItemsForType,
  createPodItems,
  createWorkloadItems,
  getPodsForDeploymentConfigs,
  getPodsForDeployments,
} from '../resource-utils';

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveProperties(a: string[]): R;
    }
  }
}

const knativeOverviewResourceUtils: OverviewResourceUtil[] = [
  {
    type: 'Overview/ResourceUtil',
    properties: {
      getResources: getKnativeServingRevisions,
    },
  },
  {
    type: 'Overview/ResourceUtil',
    properties: {
      getResources: getKnativeServingConfigurations,
    },
  },
  {
    type: 'Overview/ResourceUtil',
    properties: {
      getResources: getKnativeServingRoutes,
    },
  },
  {
    type: 'Overview/ResourceUtil',
    properties: {
      getResources: getKnativeServingServices,
    },
  },
];

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
  JOBS = 'jobs',
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
  it('should create Deployment config Items for a provided dc', () => {
    const transformedData = createDeploymentConfigItems(
      sampleDeploymentConfigs.data,
      MockResources,
      knativeOverviewResourceUtils,
    );
    expect(transformedData).toHaveLength(2);
    expect(transformedData[0]).toHaveProperties(dcKeys);
  });

  it('should only have keys mentions in dcKeys for created Deployment config Items for a provided dc', () => {
    const transformedData = createDeploymentConfigItems(
      sampleDeploymentConfigs.data,
      MockResources,
      knativeOverviewResourceUtils,
    );
    expect(transformedData).toHaveLength(2);
    expect(transformedData[0]).not.toHaveProperties([...dcKeys, 'revisions']);
  });

  it('should create Deployment Items for a provided deployment', () => {
    const transformedData = createDeploymentConfigItems(
      sampleDeployments.data,
      MockResources,
      knativeOverviewResourceUtils,
    );
    expect(transformedData).toHaveLength(3);
    expect(transformedData[0]).toHaveProperties(dcKeys);
    expect(transformedData[1]).toHaveProperties(dcKeys);
  });

  it('should create Knative Deployment Items for a provided deployment', () => {
    const transformedData = createDeploymentConfigItems(
      sampleKnativeDeployments.data,
      MockKnativeResources,
      knativeOverviewResourceUtils,
    );
    expect(transformedData).toHaveLength(2);
    expect(transformedData[0]).toHaveProperties(knativeKeys);
  });

  it('should only have keys mentions in KnativeKeys for created Deployment Items for a provided deployment', () => {
    const transformedData = createDeploymentConfigItems(
      sampleDeployments.data,
      MockResources,
      knativeOverviewResourceUtils,
    );
    expect(transformedData).toHaveLength(3);
    expect(transformedData[0]).not.toHaveProperties([...knativeKeys, 'key']);
  });

  it('should create StatefulSets Items for a provided ss', () => {
    const transformedData = createWorkloadItems(
      StatefulSetModel,
      sampleStatefulSets.data,
      MockResources,
      knativeOverviewResourceUtils,
    );
    expect(transformedData).toHaveLength(1);
    expect(transformedData[0]).toHaveProperties(dsAndSSKeys);
  });

  it('should not have rc current or previous prop for created StatefulSets Items for a provided ss', () => {
    const transformedData = createWorkloadItems(
      StatefulSetModel,
      sampleStatefulSets.data,
      MockResources,
      knativeOverviewResourceUtils,
    );
    expect(transformedData).toHaveLength(1);
    expect(transformedData[0][Keys.CURRENT]).toBeUndefined();
    expect(transformedData[0][Keys.PREVIOUS]).toBeUndefined();
    expect(transformedData[0][Keys.ROLLINGOUT]).toBeUndefined();
    expect(transformedData[0][Keys.BC]).toHaveLength(0);
  });

  it('should create DaemonSets Items for a provided ds', () => {
    const transformedData = createWorkloadItems(
      DaemonSetModel,
      sampleDaemonSets.data,
      MockResources,
      knativeOverviewResourceUtils,
    );
    expect(transformedData).toHaveLength(1);
    expect(transformedData[0]).toHaveProperties(dsAndSSKeys);
  });

  it('should not have rc current or previous prop for created DaemonSets Items for a provided ds', () => {
    const transformedData = createWorkloadItems(
      DaemonSetModel,
      sampleDaemonSets.data,
      MockResources,
      knativeOverviewResourceUtils,
    );
    expect(transformedData).toHaveLength(1);
    expect(transformedData[0][Keys.CURRENT]).toBeUndefined();
    expect(transformedData[0][Keys.PREVIOUS]).toBeUndefined();
    expect(transformedData[0][Keys.ROLLINGOUT]).toBeUndefined();
    expect(transformedData[0][Keys.BC]).toHaveLength(0);
  });

  it('should return pods and replication controllers for a given DeploymentConfig', () => {
    const transformedData = getPodsForDeploymentConfigs(
      sampleDeploymentConfigs.data,
      MockResources,
    );
    expect(transformedData).toHaveLength(2);
    expect(transformedData[0]).toHaveProperties(podRCKeys);
  });

  it('should return pods and replication controllers for a given DeploymentConfig', () => {
    const transformedData = getPodsForDeployments(sampleDeployments.data, MockResources);
    expect(transformedData).toHaveLength(3);
    expect(transformedData[0]).toHaveProperties(podRCKeys);
    expect(transformedData[1]).toHaveProperties(podRCKeys);
  });

  it('should return only pods and not replication controllers for a given resource', () => {
    const transformedData = createPodItems(MockResources);
    transformedData.forEach((element) => {
      expect(element).toHaveProperties(podKeys);
    });
  });

  it('should return pods and not replication controllers for a given resource', () => {
    const transformedData = createPodItems(MockResources);
    transformedData.forEach((element) => {
      expect(element).not.toHaveProperties([...podKeys, 'current', 'previous']);
    });
  });

  it('should create standalone Job Items', () => {
    const transformedData = createOverviewItemsForType('jobs', MockResources);
    expect(transformedData).toHaveLength(1);
    expect(transformedData[0][Keys.CURRENT]).toBeUndefined();
    expect(transformedData[0][Keys.PREVIOUS]).toBeUndefined();
    expect(transformedData[0][Keys.ROLLINGOUT]).toBeUndefined();
    expect(transformedData[0][Keys.BC]).toHaveLength(0);
  });

  it('should create CronJob Items', () => {
    const transformedData = createOverviewItemsForType('cronJobs', MockResources);
    expect(transformedData).toHaveLength(1);
    expect(transformedData[0][Keys.CURRENT]).toBeUndefined();
    expect(transformedData[0][Keys.PREVIOUS]).toBeUndefined();
    expect(transformedData[0][Keys.ROLLINGOUT]).toBeUndefined();
    expect(transformedData[0][Keys.BC]).toHaveLength(1);
    expect(transformedData[0][Keys.JOBS]).toHaveLength(2);
    expect(transformedData[0][Keys.PODS]).toHaveLength(2);
  });
});
