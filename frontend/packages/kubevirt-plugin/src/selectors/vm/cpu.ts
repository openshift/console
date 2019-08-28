export const vCPUCount = (sourceCPURaw: CPUType) => {
  return (
    (parseInt(sourceCPURaw.sockets, 10) || 1) *
    (parseInt(sourceCPURaw.cores, 10) || 1) *
    (parseInt(sourceCPURaw.threads, 10) || 1)
  );
};

type CPUType = {
  sockets: string;
  cores: string;
  threads: string;
};
