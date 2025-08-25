import { HealthChecksFormData } from '../../import/import-types';
import { healthChecksDefaultValues } from '../health-checks-probe-utils';
import { RequestType } from '../health-checks-types';

export const healthChecksData: HealthChecksFormData = {
  readinessProbe: {
    showForm: false,
    enabled: true,
    modified: false,
    data: {
      failureThreshold: '3',
      requestType: RequestType.HTTPGET,
      httpGet: {
        scheme: ['HTTP'],
        path: '/',
        port: '8080',
        httpHeaders: [{ name: 'header', value: 'val' }],
      },
      initialDelaySeconds: '0',
      periodSeconds: '10',
      timeoutSeconds: '1',
      successThreshold: '1',
    },
  },
  livenessProbe: {
    showForm: false,
    enabled: true,
    modified: false,
    data: {
      failureThreshold: '3',
      requestType: RequestType.ContainerCommand,
      exec: { command: ['cat', '/tmp/healthy'] },
      initialDelaySeconds: '0',
      periodSeconds: '10',
      timeoutSeconds: '1',
      successThreshold: '1',
    },
  },
  startupProbe: healthChecksDefaultValues,
};

export const healthChecksInputData = {
  healthChecks: {
    readinessProbe: {
      showForm: false,
      enabled: true,
      modified: false,
      data: {
        ...healthChecksDefaultValues.data,
        httpGet: {
          scheme: ['HTTPS'],
          path: '/tmp/healthy',
          port: '8080',
          httpHeaders: [{ name: 'custom-header', value: 'value' }],
        },
      },
    },
    livenessProbe: healthChecksDefaultValues,
    startupProbe: {
      showForm: false,
      enabled: true,
      modified: false,
      data: {
        ...healthChecksDefaultValues.data,
        requestType: RequestType.TCPSocket,
        tcpSocket: {
          port: '8081',
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
    initialDelaySeconds: 0,
    periodSeconds: 10,
    successThreshold: 1,
    timeoutSeconds: 1,
  },
  startupProbe: {
    failureThreshold: 3,
    initialDelaySeconds: 0,
    periodSeconds: 10,
    successThreshold: 1,
    tcpSocket: {
      port: 8081,
    },
    timeoutSeconds: 1,
  },
  livenessProbe: {
    failureThreshold: 3,
    httpGet: {
      httpHeaders: [],
      path: '/',
      port: 8080,
      scheme: 'HTTP',
    },
    initialDelaySeconds: 0,
    periodSeconds: 10,
    successThreshold: 1,
    timeoutSeconds: 1,
  },
};

export const healthChecksFormInputData = {
  healthChecks: {
    readinessProbe: {
      showForm: false,
      enabled: true,
      modified: false,
      data: {
        failureThreshold: '3',
        requestType: RequestType.HTTPGET,
        httpGet: {
          scheme: 'HTTPS',
          path: '/tmp/healthy',
          port: 8080,
          httpHeaders: [{ name: 'custom-header', value: 'value' }],
        },
        tcpSocket: {
          port: 8080,
        },
        exec: { command: [''] },
        initialDelaySeconds: '0',
        periodSeconds: '10',
        timeoutSeconds: '1',
        successThreshold: '1',
      },
    },
    livenessProbe: healthChecksDefaultValues,
    startupProbe: {
      showForm: false,
      enabled: true,
      modified: false,
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
