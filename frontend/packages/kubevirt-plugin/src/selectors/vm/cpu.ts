import { CPU, CPURaw } from '../../types';

export const DEFAULT_CPU: CPU = { sockets: 1, cores: 1, threads: 1 };

export const parseCPU = (sourceCPURaw: CPURaw, defaultValue?: CPU): CPU => {
  if (!sourceCPURaw) {
    return defaultValue;
  }

  if (typeof sourceCPURaw === 'string') {
    return { sockets: 1, cores: parseInt(sourceCPURaw as string, 10), threads: 1 };
  }

  return {
    sockets: parseInt(sourceCPURaw.sockets, 10) || 1,
    cores: parseInt(sourceCPURaw.cores, 10) || 1,
    threads: parseInt(sourceCPURaw.threads, 10) || 1,
  };
};

export const vCPUCount = (sourceCPURaw: CPURaw): number => {
  const cpu = parseCPU(sourceCPURaw, DEFAULT_CPU);
  return cpu.sockets * cpu.cores * cpu.threads;
};
