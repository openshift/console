import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { appResources } from '../../edit-application/__tests__/edit-application-data';
import { Resources } from '../../import/import-types';
import {
  getHealthChecksData,
  getRequestType,
  constructProbeData,
  getProbesData,
  convertResourceDataToFormData,
} from '../create-health-checks-probe-utils';
import { HealthCheckProbeData } from '../health-checks-types';
import {
  healthChecksData,
  healthChecksInputData,
  enabledProbeData,
} from './create-health-checks-probe-data';

describe('Create Health Check probe Utils', () => {
  const { editAppResource } = appResources;

  if (editAppResource?.data?.spec?.template?.spec?.containers?.[0]) {
    editAppResource.data.spec.template.spec.containers[0].readinessProbe = {
      failureThreshold: 3,
      httpGet: {
        scheme: 'HTTP',
        path: '/',
        port: 8080,
        httpHeaders: [{ name: 'header', value: 'val' }],
      },
      initialDelaySeconds: 0,
      periodSeconds: 10,
      timeoutSeconds: 1,
      successThreshold: 1,
    };
    editAppResource.data.spec.template.spec.containers[0].livenessProbe = {
      failureThreshold: 3,
      exec: { command: ['cat', '/tmp/healthy'] },
      initialDelaySeconds: 0,
      periodSeconds: 10,
      timeoutSeconds: 1,
      successThreshold: 1,
    };
  }

  it('getHealthChecksData should return health checks probe data based on the appresources', () => {
    expect(getHealthChecksData(editAppResource?.data as K8sResourceKind)).toEqual(healthChecksData);
  });

  it('getRequestType should return the proper request type from the health check probe data', () => {
    expect(
      getRequestType(editAppResource?.data?.spec?.template?.spec?.containers?.[0]?.readinessProbe),
    ).toEqual('httpGet');
    expect(
      getRequestType(editAppResource?.data?.spec?.template?.spec?.containers?.[0]?.livenessProbe),
    ).toEqual('command');
  });
  it('constructProbeData should return the proper health check object from the health checks input data', () => {
    expect(constructProbeData(healthChecksInputData.healthChecks.readinessProbe.data)).toEqual(
      enabledProbeData.readinessProbe,
    );
    expect(constructProbeData(healthChecksInputData.healthChecks.livenessProbe.data)).toEqual(
      enabledProbeData.livenessProbe,
    );
    expect(constructProbeData(healthChecksInputData.healthChecks.startupProbe.data)).toEqual(
      enabledProbeData.startupProbe,
    );
  });

  it('getProbesData should return all the enabled probes', () => {
    expect(getProbesData(healthChecksInputData.healthChecks)).toEqual({
      readinessProbe: enabledProbeData.readinessProbe,
      startupProbe: enabledProbeData.startupProbe,
    });
  });

  it('getProbesData should not return startup probes in case of knative service', () => {
    const enabledProbeDataForKnativeService = _.cloneDeep(enabledProbeData.readinessProbe);
    enabledProbeDataForKnativeService.httpGet.port = 0;
    expect(getProbesData(healthChecksInputData.healthChecks, Resources.KnativeService)).toEqual({
      readinessProbe: enabledProbeDataForKnativeService,
    });
  });

  it('should convert resource health checks data to formData', () => {
    const readinessProbe = {
      failureThreshold: 3,
      httpGet: {
        scheme: 'HTTP',
        path: '/',
        port: 8080,
        httpHeaders: [{ name: 'header', value: 'val' }],
      },
      initialDelaySeconds: 0,
      periodSeconds: 10,
      timeoutSeconds: 1,
      successThreshold: 1,
    };
    const data = {
      failureThreshold: '3',
      requestType: 'httpGet',
      httpGet: {
        scheme: undefined,
        path: '/',
        port: '8080',
        httpHeaders: [{ name: 'header', value: 'val' }],
      },
      initialDelaySeconds: '0',
      periodSeconds: '10',
      timeoutSeconds: '1',
      successThreshold: '1',
    };
    const formData = convertResourceDataToFormData(readinessProbe);
    expect(formData).toEqual(data);
  });

  it('should convert resource health checks data to formData', () => {
    const readinessProbe = {
      httpGet: {
        scheme: 'HTTPS',
        path: '/',
        port: 8080,
        httpHeaders: [{ name: 'header', value: 'val' }],
      },
      successThreshold: 1,
    } as HealthCheckProbeData;
    const data = {
      requestType: 'httpGet',
      httpGet: {
        scheme: ['HTTPS'],
        path: '/',
        port: '8080',
        httpHeaders: [{ name: 'header', value: 'val' }],
      },
      successThreshold: '1',
      failureThreshold: '',
      initialDelaySeconds: '',
      periodSeconds: '',
      timeoutSeconds: '',
    };
    const formData = convertResourceDataToFormData(readinessProbe);
    expect(formData).toEqual(data);
  });
});
