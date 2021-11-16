import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { InfrastructureModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getInfrastructureAPIURL } from '@console/shared/src';
import { getCloudInitValues } from '../components/ssh-service/SSHForm/ssh-form-utils';
import { VMIKind, VMKind } from '../types';
import useSSHService from './use-ssh-service';

export type useSSHCommandResult = {
  command: string;
  user: string;
  port: number;
  isRoutesLoaded: boolean;
  loadingRoutesError: string;
};

const useSSHCommand = (vm: VMKind | VMIKind): useSSHCommandResult => {
  const { sshServices } = useSSHService(vm);
  const [infrastructure, infrastructureLoaded, infrastructureError] = useK8sGet<K8sResourceKind>(
    InfrastructureModel,
    'cluster',
  );
  const infrastuctureApiUrl =
    infrastructureLoaded && !infrastructureError && getInfrastructureAPIURL(infrastructure);
  const apiHostname = infrastuctureApiUrl && new URL(infrastuctureApiUrl).hostname;
  const consoleHostname = window.location.hostname; // fallback to console hostname

  const user = getCloudInitValues(vm, 'user');
  const command = `ssh ${user && `${user}@`}${apiHostname || consoleHostname} -p ${
    sshServices?.port
  }`;

  return {
    command,
    user,
    port: sshServices?.port,
    isRoutesLoaded: infrastructureLoaded,
    loadingRoutesError: infrastructureError,
  };
};

export default useSSHCommand;
