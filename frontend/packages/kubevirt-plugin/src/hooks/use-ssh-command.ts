import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { InfrastructureModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getInfrastructureAPIURL } from '@console/shared/src';
import { getCloudInitValues } from '../components/ssh-service/SSHForm/ssh-form-utils';
import { VMIKind, VMKind } from '../types';

export type useSSHCommandResult = {
  command: string;
  user: string;
  port: number;
  isRoutesLoaded: boolean;
  loadingRoutesError: string;
};

type useSSHCommandType = (
  sshServices: {
    running: boolean;
    port: number;
    serviceName: string;
  },
  vm: VMKind | VMIKind,
) => useSSHCommandResult;

const useSSHCommand: useSSHCommandType = (sshServices, vm): useSSHCommandResult => {
  const [infrastructure, infrastructureLoaded, infrastructureError] = useK8sGet<K8sResourceKind>(
    InfrastructureModel,
    'cluster',
  );
  const infrastuctureApiUrl =
    infrastructureLoaded && !infrastructureError && getInfrastructureAPIURL(infrastructure);
  const apiHostname = infrastuctureApiUrl && new URL(infrastuctureApiUrl).hostname;
  const consoleHostname = window.location.hostname; // fallback to console hostname

  const user = getCloudInitValues(vm, 'user');

  let command = 'ssh ';

  if (user) command += `${user}@`;

  command += `${apiHostname || consoleHostname} -p ${sshServices?.port}`;

  return {
    command,
    user,
    port: sshServices?.port,
    isRoutesLoaded: infrastructureLoaded,
    loadingRoutesError: infrastructureError,
  };
};

export default useSSHCommand;
