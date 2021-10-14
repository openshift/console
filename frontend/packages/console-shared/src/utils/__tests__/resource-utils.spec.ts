import * as _ from 'lodash';
import { Alert } from '@console/internal/components/monitoring/types';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { mockAlerts } from '../__mocks__/alerts-and-rules-data';
import { getResourceData, getWorkloadMonitoringAlerts } from '../resource-utils';

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
