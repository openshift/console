import { HealthChecksProbeType, RequestType, HealthCheckProbe } from './health-checks-types';

export const getHealthChecksProbeConfig = (probe: string) => {
  switch (probe) {
    case HealthChecksProbeType.ReadinessProbe: {
      return {
        formTitle: 'Readiness Probe',
        formSubtitle:
          "A Readiness probe checks if the container is ready to handle requests. A failed readiness probe means that a container should not receive any traffic from a proxy, even if it's running.",
      };
    }
    case HealthChecksProbeType.LivenessProbe: {
      return {
        formTitle: 'Liveness Probe',
        formSubtitle:
          'A Liveness probe checks if the container is still running. If the liveness probe fails the container is killed.',
      };
    }
    case HealthChecksProbeType.StartupProbe: {
      return {
        formTitle: 'Startup Probe',
        formSubtitle:
          'A Startup probe checks if the application within the container is started. If the startup probe fails the container is killed.',
      };
    }
    default:
      return undefined;
  }
};

export const healthChecksDefaultValues: HealthCheckProbe = {
  showForm: false,
  enabled: false,
  data: {
    failureThreshold: 3,
    requestType: RequestType.HTTPGET,
    httpGet: {
      scheme: 'HTTP',
      path: '/',
      port: 8080,
      httpHeaders: [],
    },
    tcpSocket: {
      port: 8080,
    },
    exec: { command: [''] },
    initialDelaySeconds: 0,
    periodSeconds: 10,
    timeoutSeconds: 1,
    successThreshold: 1,
  },
};

export const healthChecksProbeInitialData = {
  readinessProbe: healthChecksDefaultValues,
  livenessProbe: healthChecksDefaultValues,
  startupProbe: healthChecksDefaultValues,
};
