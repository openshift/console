import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { Resources, HealthChecksFormData } from '../import/import-types';
import { healthChecksDefaultValues } from './health-checks-probe-utils';
import {
  HealthCheckProbeData,
  RequestType,
  HealthChecksProbeType,
  HealthCheckFormProbeData,
} from './health-checks-types';

export const constructProbeData = (
  data: HealthCheckFormProbeData,
  resourceType?: Resources,
): HealthCheckProbeData => {
  const probeData = {
    ...(data.failureThreshold && { failureThreshold: _.toInteger(data.failureThreshold) }),
    ...(data.successThreshold && { successThreshold: _.toInteger(data.successThreshold) }),
    ...(data.requestType === RequestType.ContainerCommand && {
      exec: data.exec,
    }),
    ...(data.requestType === RequestType.HTTPGET && {
      httpGet: {
        ...data[data.requestType],
        scheme: data[data.requestType]?.scheme ? data[data.requestType].scheme[0] : 'HTTP',
        port: resourceType === Resources.KnativeService ? 0 : _.toInteger(data.httpGet.port),
      },
    }),
    ...(data.requestType === RequestType.TCPSocket && {
      tcpSocket: {
        port: resourceType === Resources.KnativeService ? 0 : _.toInteger(data.tcpSocket.port),
      },
    }),
    ...(data.initialDelaySeconds && {
      initialDelaySeconds: _.toInteger(data.initialDelaySeconds),
    }),
    ...(data.periodSeconds && { periodSeconds: _.toInteger(data.periodSeconds) }),
    ...(data.timeoutSeconds && { timeoutSeconds: _.toInteger(data.timeoutSeconds) }),
  };
  return probeData;
};

export const getRequestType = (data: HealthCheckProbeData) => {
  if (_.has(data, RequestType.HTTPGET)) return RequestType.HTTPGET;
  if (_.has(data, RequestType.TCPSocket)) return RequestType.TCPSocket;
  if (_.has(data, 'exec.command')) return RequestType.ContainerCommand;
  return '';
};

export const convertResourceDataToFormData = (
  resourceData: HealthCheckProbeData,
): HealthCheckFormProbeData => {
  return {
    ...resourceData,
    requestType: getRequestType(resourceData),
    failureThreshold: resourceData.failureThreshold.toString(),
    successThreshold: resourceData.successThreshold.toString(),
    initialDelaySeconds: resourceData.initialDelaySeconds?.toString(),
    periodSeconds: resourceData.periodSeconds.toString(),
    timeoutSeconds: resourceData.timeoutSeconds.toString(),
    ...(resourceData.httpGet && {
      httpGet: {
        ...resourceData.httpGet,
        port: resourceData.httpGet.port.toString(),
        scheme: resourceData.httpGet.scheme === 'HTTP' ? undefined : ['HTTPS'],
      },
    }),
    ...(resourceData.tcpSocket && {
      tcpSocket: { port: resourceData.tcpSocket.port.toString() },
    }),
  };
};

export const getHealthChecksData = (
  resource: K8sResourceKind,
  containerIndex: number = 0,
): HealthChecksFormData => {
  const containers = resource?.spec?.template?.spec?.containers ?? [];
  const readinessProbe: HealthCheckProbeData =
    containers?.[containerIndex]?.[HealthChecksProbeType.ReadinessProbe] ?? {};
  const livenessProbe: HealthCheckProbeData =
    containers?.[containerIndex]?.[HealthChecksProbeType.LivenessProbe] ?? {};
  const startupProbe: HealthCheckProbeData =
    containers?.[containerIndex]?.[HealthChecksProbeType.StartupProbe] ?? {};

  const healthChecks = {
    readinessProbe: {
      showForm: false,
      modified: false,
      enabled: !_.isEmpty(readinessProbe),
      data: !_.isEmpty(readinessProbe)
        ? {
            ...convertResourceDataToFormData(readinessProbe),
          }
        : healthChecksDefaultValues.data,
    },
    livenessProbe: {
      showForm: false,
      modified: false,
      enabled: !_.isEmpty(livenessProbe),
      data: !_.isEmpty(livenessProbe)
        ? {
            ...convertResourceDataToFormData(livenessProbe),
          }
        : healthChecksDefaultValues.data,
    },
    startupProbe: {
      showForm: false,
      modified: false,
      enabled: !_.isEmpty(startupProbe),
      data: !_.isEmpty(startupProbe)
        ? {
            ...convertResourceDataToFormData(startupProbe),
          }
        : healthChecksDefaultValues.data,
    },
  };
  return healthChecks;
};

export const getProbesData = (healthChecks: HealthChecksFormData, resourceType?: Resources) => {
  const { readinessProbe, livenessProbe, startupProbe } = healthChecks;
  return {
    ...(readinessProbe.enabled
      ? { readinessProbe: constructProbeData(readinessProbe.data, resourceType) }
      : {}),
    ...(livenessProbe.enabled
      ? { livenessProbe: constructProbeData(livenessProbe.data, resourceType) }
      : {}),
    ...(resourceType !== Resources.KnativeService && startupProbe?.enabled
      ? { startupProbe: constructProbeData(startupProbe.data) }
      : {}),
  };
};
