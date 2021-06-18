import { TFunction } from 'i18next';
import { HealthChecksProbeType, RequestType, HealthCheckFormProbe } from './health-checks-types';

export const getHealthChecksProbeConfig = (probe: string, t: TFunction) => {
  switch (probe) {
    case HealthChecksProbeType.ReadinessProbe: {
      return {
        formTitle: t('devconsole~Readiness probe'),
        formSubtitle: t(
          "devconsole~A readiness probe checks if the Container is ready to handle requests. A failed readiness probe means that a Container should not receive any traffic from a proxy, even if it's running.",
        ),
      };
    }
    case HealthChecksProbeType.LivenessProbe: {
      return {
        formTitle: t('devconsole~Liveness probe'),
        formSubtitle: t(
          'devconsole~A liveness probe checks if the Container is still running. If the liveness probe fails the Container is killed.',
        ),
      };
    }
    case HealthChecksProbeType.StartupProbe: {
      return {
        formTitle: t('devconsole~Startup probe'),
        formSubtitle: t(
          'devconsole~A startup probe checks if the Application within the Container is started. If the startup probe fails the Container is killed.',
        ),
      };
    }
    default:
      return undefined;
  }
};

export const healthChecksDefaultValues: HealthCheckFormProbe = {
  showForm: false,
  enabled: false,
  modified: false,
  data: {
    failureThreshold: '3',
    requestType: RequestType.HTTPGET,
    httpGet: {
      scheme: undefined,
      path: '/',
      port: '8080',
      httpHeaders: [],
    },
    tcpSocket: {
      port: '8080',
    },
    exec: { command: [''] },
    initialDelaySeconds: '0',
    periodSeconds: '10',
    timeoutSeconds: '1',
    successThreshold: '1',
  },
};

export const healthChecksProbeInitialData = {
  readinessProbe: healthChecksDefaultValues,
  livenessProbe: healthChecksDefaultValues,
  startupProbe: healthChecksDefaultValues,
};
