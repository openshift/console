export enum HealthChecksProbeType {
  ReadinessProbe = 'readinessProbe',
  LivenessProbe = 'livenessProbe',
  StartupProbe = 'startupProbe',
}

export enum ProbeType {
  HTTPGET = 'httpGet',
  ContainerCommand = 'containerCommand',
  TCPSocket = 'tcpSocket',
}

export interface ProbeTypeDataType {
  httpGet: {
    scheme: string;
    path: string;
    port: string;
    httpHeaders: object;
  };
  tcpSocket: {
    port: string;
  };
  command: string[];
}

export interface HealthCheckProbeDataType extends ProbeTypeDataType {
  failureThreshold: string;
  probeType: string;
  initialDelaySeconds: string;
  periodSeconds: string;
  timeoutSeconds: string;
  successThreshold: string;
}
