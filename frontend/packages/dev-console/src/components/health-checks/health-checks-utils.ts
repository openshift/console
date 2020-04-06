import { ProbeType, HealthChecksProbeType, HealthCheckProbeDataType } from './health-checks-types';

export const getProbeTypeData = () => {
  const probeTypeData = {
    httpGet: {
      scheme: 'HTTP',
      path: '/',
      port: '8080',
      httpHeaders: {},
    },
    tcpSocket: {
      port: '8080',
    },
    command: [''],
  };
  return probeTypeData;
};

export const getHealthChecksProbeData = (probe: string): HealthCheckProbeDataType => {
  const healthChecksProbeData = {
    [HealthChecksProbeType.ReadinessProbe]: {
      failureThreshold: '3',
      probeType: ProbeType.HTTPGET,
      ...getProbeTypeData(),
      initialDelaySeconds: '0',
      periodSeconds: '10',
      timeoutSeconds: '1',
      successThreshold: '1',
    },
    [HealthChecksProbeType.LivenessProbe]: {
      failureThreshold: '3',
      probeType: ProbeType.HTTPGET,
      ...getProbeTypeData(),
      initialDelaySeconds: '0',
      periodSeconds: '10',
      timeoutSeconds: '1',
      successThreshold: '1',
    },
    [HealthChecksProbeType.StartupProbe]: {
      failureThreshold: '3',
      probeType: ProbeType.HTTPGET,
      ...getProbeTypeData(),
      initialDelaySeconds: '0',
      periodSeconds: '10',
      timeoutSeconds: '1',
      successThreshold: '1',
    },
  };
  return healthChecksProbeData[probe];
};
