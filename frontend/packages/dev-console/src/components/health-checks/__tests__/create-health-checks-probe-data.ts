import { HealthChecksData } from '../../import/import-types';
import { RequestType } from '../health-checks-types';
import { healthChecksDefaultValues } from '../health-checks-probe-utils';

export const healthChecksData: HealthChecksData = {
  readinessProbe: {
    showForm: false,
    enabled: true,
    data: {
      failureThreshold: 3,
      requestType: RequestType.HTTPGET,
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
    },
  },
  livenessProbe: {
    showForm: false,
    enabled: true,
    data: {
      failureThreshold: 3,
      requestType: RequestType.ContainerCommand,
      exec: { command: ['cat', '/tmp/healthy'] },
      initialDelaySeconds: 0,
      periodSeconds: 10,
      timeoutSeconds: 1,
      successThreshold: 1,
    },
  },
  startupProbe: healthChecksDefaultValues,
};

export const healthChecksInputData = {
  healthChecks: {
    readinessProbe: {
      showForm: false,
      enabled: true,
      data: {
        ...healthChecksDefaultValues.data,
        httpGet: {
          scheme: 'HTTPS',
          path: '/tmp/healthy',
          port: 8080,
          httpHeaders: [{ name: 'custom-header', value: 'value' }],
        },
      },
    },
    livenessProbe: healthChecksDefaultValues,
    startupProbe: {
      showForm: false,
      enabled: true,
      data: {
        ...healthChecksDefaultValues.data,
        requestType: RequestType.TCPSocket,
        tcpSocket: {
          port: 8081,
        },
      },
    },
  },
};

export const enabledProbeData = {
  readinessProbe: {
    failureThreshold: 3,
    httpGet: {
      httpHeaders: [{ name: 'custom-header', value: 'value' }],
      path: '/tmp/healthy',
      port: 8080,
      scheme: 'HTTPS',
    },
    periodSeconds: 10,
    successThreshold: 1,
    timeoutSeconds: 1,
  },
  startupProbe: {
    failureThreshold: 3,
    periodSeconds: 10,
    successThreshold: 1,
    tcpSocket: {
      port: 8081,
    },
    timeoutSeconds: 1,
  },
};
