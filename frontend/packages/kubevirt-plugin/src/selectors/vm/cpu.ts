export const vCPUCount = (sourceCPURaw: CPURaw) => {
  return (
    (parseInt(sourceCPURaw.sockets, 10) || 1) *
    (parseInt(sourceCPURaw.cores, 10) || 1) *
    (parseInt(sourceCPURaw.threads, 10) || 1)
  );
};

type CPURaw = {
  sockets: string;
  cores: string;
  threads: string;
};
