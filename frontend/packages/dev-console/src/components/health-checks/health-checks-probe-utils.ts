import { TFunction } from 'i18next';
import { HealthChecksProbeType, RequestType, HealthCheckProbe } from './health-checks-types';

export const getHealthChecksProbeConfig = (probe: string, t: TFunction) => {
  switch (probe) {
    case HealthChecksProbeType.ReadinessProbe: {
      return {
        formTitle: t('devconsole~Readiness Probe'),
        formSubtitle: t(
          "devconsole~A Readiness probe checks if the container is ready to handle requests. A failed readiness probe means that a container should not receive any traffic from a proxy, even if it's running.",
        ),
      };
    }
    case HealthChecksProbeType.LivenessProbe: {
      return {
        formTitle: t('devconsole~Liveness Probe'),
        formSubtitle: t(
          'devconsole~A Liveness probe checks if the container is still running. If the liveness probe fails the container is killed.',
        ),
      };
    }
    case HealthChecksProbeType.StartupProbe: {
      return {
        formTitle: t('devconsole~Startup Probe'),
        formSubtitle: t(
          'devconsole~A Startup probe checks if the application within the container is started. If the startup probe fails the container is killed.',
        ),
      };
    }
    default:
      return undefined;
  }
};

export const healthChecksDefaultValues: HealthCheckProbe = {
  showForm: false,
  enabled: false,
  modified: false,
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
