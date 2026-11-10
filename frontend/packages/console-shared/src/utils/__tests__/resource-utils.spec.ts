import * as _ from 'lodash';
import type { Alert } from '@console/dynamic-plugin-sdk';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import type { LimitsData } from '../../types/resource';
import {
  getResourceData,
  getWorkloadMonitoringAlerts,
  mergeResourceLimitsData,
} from '../resource-utils';
import { mockAlerts } from './data/alerts-and-rules-data';

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveProperties(a: string[]): R;
    }
  }
}

expect.extend({
  toHaveProperties(received, argument) {
    const pass = argument.every((arg: string) => _.has(received, arg));
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

describe('TransformResourceData', () => {
  it('should return all the alerts related to a workload', () => {
    const deploymentResource: K8sResourceKind = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: 'prometheus-example-app',
        uid: '6876876',
        namespace: 'ns1',
        labels: {
          app: 'prometheus-example-app',
        },
      },
      spec: {
        replicas: '1',
      },
    };
    const alerts: Alert[] = getWorkloadMonitoringAlerts(deploymentResource, mockAlerts);
    const expectedAlerts: Alert[] = _.pullAt(mockAlerts.data, [0, 1, 4]);
    expect(alerts).toEqual(expectedAlerts);
  });

  it('should return proper limit with unit data', () => {
    let limit;
    let unit;
    [limit, unit] = getResourceData('3Mi');
    expect(limit).toBe('3');
    expect(unit).toBe('Mi');
    [limit, unit] = getResourceData('5');
    expect(limit).toBe('5');
    expect(unit).toBe('');
    [limit, unit] = getResourceData('4m');
    expect(limit).toBe('4');
    expect(unit).toBe('m');
    [limit, unit] = getResourceData('2Gi');
    expect(limit).toBe('2');
    expect(unit).toBe('Gi');
  });
});

describe('mergeResourceLimitsData', () => {
  const limitsData: LimitsData = {
    cpu: {
      request: '500',
      requestUnit: 'm',
      defaultRequestUnit: 'm',
      limit: '2',
      limitUnit: '',
      defaultLimitUnit: '',
    },
    memory: {
      request: '2',
      requestUnit: 'Gi',
      defaultRequestUnit: 'Gi',
      limit: '4',
      limitUnit: 'Gi',
      defaultLimitUnit: 'Gi',
    },
  };

  // Regression test for OCPBUGS-135948: https://issues.redhat.com/browse/OCPBUGS-135948
  // Editing CPU/memory must not drop existing ephemeral-storage (or other
  // unmodeled resource keys) from the container's resources object.
  it('should preserve ephemeral-storage and other unmodeled keys when editing cpu/memory', () => {
    const existingResources = {
      requests: {
        cpu: '0.5',
        memory: '2Gi',
        'ephemeral-storage': '200Mi',
        'hugepages-2Mi': '100Mi',
      },
      limits: {
        cpu: '1',
        memory: '4Gi',
        'ephemeral-storage': '400Mi',
      },
    };

    const merged = mergeResourceLimitsData(limitsData, existingResources);

    expect(merged).toEqual({
      requests: {
        cpu: '500m',
        memory: '2Gi',
        'ephemeral-storage': '200Mi',
        'hugepages-2Mi': '100Mi',
      },
      limits: {
        cpu: '2',
        memory: '4Gi',
        'ephemeral-storage': '400Mi',
      },
    });
  });

  it('should not mutate the existing resources object', () => {
    const existingResources = {
      limits: { cpu: '1', 'ephemeral-storage': '400Mi' },
    };

    mergeResourceLimitsData(limitsData, existingResources);

    expect(existingResources).toEqual({
      limits: { cpu: '1', 'ephemeral-storage': '400Mi' },
    });
  });

  it('should add cpu/memory when no existing resources are present', () => {
    const merged = mergeResourceLimitsData(limitsData);

    expect(merged).toEqual({
      requests: { cpu: '500m', memory: '2Gi' },
      limits: { cpu: '2', memory: '4Gi' },
    });
  });

  it('should remove cpu/memory keys that are cleared while preserving other keys', () => {
    const clearedLimits: LimitsData = {
      cpu: {
        request: '',
        requestUnit: '',
        defaultRequestUnit: '',
        limit: '',
        limitUnit: '',
        defaultLimitUnit: '',
      },
      memory: {
        request: '',
        requestUnit: '',
        defaultRequestUnit: '',
        limit: '',
        limitUnit: '',
        defaultLimitUnit: '',
      },
    };
    const existingResources = {
      requests: { cpu: '1', memory: '2Gi', 'ephemeral-storage': '200Mi' },
      limits: { cpu: '1', memory: '4Gi' },
    };

    const merged = mergeResourceLimitsData(clearedLimits, existingResources);

    expect(merged).toEqual({
      requests: { 'ephemeral-storage': '200Mi' },
    });
  });
});
