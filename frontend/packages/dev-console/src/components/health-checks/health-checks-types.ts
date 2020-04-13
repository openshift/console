import { NameValuePair } from '@console/shared';

export enum HealthChecksProbeType {
  ReadinessProbe = 'readinessProbe',
  LivenessProbe = 'livenessProbe',
  StartupProbe = 'startupProbe',
}

export enum RequestType {
  HTTPGET = 'httpGet',
  ContainerCommand = 'command',
  TCPSocket = 'tcpSocket',
}

export interface HealthCheckProbeData {
  failureThreshold: number;
  requestType?: string;
  httpGet?: {
    scheme: string;
    path: string;

    port: number;
    httpHeaders: NameValuePair[];
  };
  tcpSocket?: {
    port: number;
  };
  exec: { command?: string[] };
  initialDelaySeconds: number;
  periodSeconds: number;
  timeoutSeconds: number;
  successThreshold: number;
}

export interface HealthCheckProbe {
  showForm?: boolean;
  enabled?: boolean;
  data: HealthCheckProbeData;
}
