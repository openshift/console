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
  initialDelaySeconds: number;
  periodSeconds: number;
  timeoutSeconds: number;
  successThreshold: number;
  requestType?: string;
  exec?: { command?: string[] };
  httpGet?: {
    scheme: string;
    path: string;
    port: number;
    httpHeaders: NameValuePair[];
  };
  tcpSocket?: {
    port: number;
  };
}

export interface HealthCheckFormProbeData {
  failureThreshold: string;
  initialDelaySeconds: string;
  periodSeconds: string;
  timeoutSeconds: string;
  successThreshold: string;
  requestType?: string;
  exec?: { command?: string[] };
  httpGet?: {
    scheme: string[];
    path: string;
    port: string;
    httpHeaders: NameValuePair[];
  };
  tcpSocket?: {
    port: string;
  };
}
export interface HealthCheckFormProbe {
  showForm?: boolean;
  enabled?: boolean;
  modified?: boolean;
  data: HealthCheckFormProbeData;
}
