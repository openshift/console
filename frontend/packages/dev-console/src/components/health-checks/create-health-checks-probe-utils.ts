import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { HealthCheckProbeData, RequestType, HealthChecksProbeType } from './health-checks-types';
import { Resources, HealthChecksData } from '../import/import-types';
import { healthChecksDefaultValues } from './health-checks-probe-utils';

export const constructProbeData = (data: HealthCheckProbeData, resourceType?: Resources) => {
  const probeData = {
    ...(data.failureThreshold && { failureThreshold: data.failureThreshold }),
    ...(data.successThreshold && { successThreshold: data.successThreshold }),
    ...(data.requestType === RequestType.ContainerCommand && {
      exec: data.exec,
    }),
    ...(data.requestType === RequestType.HTTPGET && {
      httpGet: {
        ...data[data.requestType],
        ...(data[data.requestType]?.scheme?.[0] === 'HTTPS' && {
          scheme: data[data.requestType].scheme[0],
        }),
        port: resourceType === Resources.KnativeService ? 0 : _.toInteger(data.httpGet.port),
      },
    }),
    ...(data.requestType === RequestType.TCPSocket && {
      tcpSocket: {
        port: resourceType === Resources.KnativeService ? 0 : _.toInteger(data.tcpSocket.port),
      },
    }),
    ...(data.initialDelaySeconds && {
      initialDelaySeconds: data.initialDelaySeconds,
    }),
    ...(data.periodSeconds && { periodSeconds: data.periodSeconds }),
    ...(data.timeoutSeconds && { timeoutSeconds: data.timeoutSeconds }),
  };
  return probeData;
};

export const getRequestType = (data: HealthCheckProbeData) => {
  if (_.has(data, RequestType.HTTPGET)) return RequestType.HTTPGET;
  if (_.has(data, RequestType.TCPSocket)) return RequestType.TCPSocket;
  if (_.has(data, 'exec.command')) return RequestType.ContainerCommand;
  return '';
};

export const getHealthChecksData = (
  resource: K8sResourceKind,
  containerIndex: number = 0,
): HealthChecksData => {
  const containers = resource?.spec?.template?.spec?.containers ?? [];
  const readinessProbe = containers?.[containerIndex]?.[HealthChecksProbeType.ReadinessProbe] ?? {};
  const livenessProbe = containers?.[containerIndex]?.[HealthChecksProbeType.LivenessProbe] ?? {};
  const startupProbe = containers?.[containerIndex]?.[HealthChecksProbeType.StartupProbe] ?? {};
  const healthChecks = {
    readinessProbe: {
      showForm: false,
      enabled: !_.isEmpty(readinessProbe),
      data: !_.isEmpty(readinessProbe)
        ? {
            ...readinessProbe,
            requestType: getRequestType(readinessProbe),
            ...(readinessProbe.httpGet?.scheme === 'HTTPS' && {
              httpGet: { ...readinessProbe.httpGet, scheme: ['HTTPS'] },
            }),
          }
        : healthChecksDefaultValues.data,
    },
    livenessProbe: {
      showForm: false,
      enabled: !_.isEmpty(livenessProbe),
      data: !_.isEmpty(livenessProbe)
        ? {
            ...livenessProbe,
            requestType: getRequestType(livenessProbe),
            ...(livenessProbe.httpGet?.scheme === 'HTTPS' && {
              httpGet: { ...livenessProbe.httpGet, scheme: ['HTTPS'] },
            }),
          }
        : healthChecksDefaultValues.data,
    },
    startupProbe: {
      showForm: false,
      enabled: !_.isEmpty(startupProbe),
      data: !_.isEmpty(startupProbe)
        ? {
            ...startupProbe,
            requestType: getRequestType(startupProbe),
            ...(startupProbe.httpGet?.scheme === 'HTTPS' && {
              httpGet: { ...startupProbe.httpGet, scheme: ['HTTPS'] },
            }),
          }
        : healthChecksDefaultValues.data,
    },
  };
  return healthChecks;
};

export const getProbesData = (healthChecks: HealthChecksData, resourceType?: Resources) => {
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
