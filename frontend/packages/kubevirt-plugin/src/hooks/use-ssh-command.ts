import { getCloudInitValues, TARGET_PORT } from '../components/ssh-service/SSHForm/ssh-form-utils';
import { VMKind } from '../types';
import { useSSHService2 } from './use-ssh-service';

export type useSSHCommandResult = {
  command: string;
  user: string;
  port: number;
  isRoutesLoaded: boolean;
  loadingRoutesError: string;
};

// based on dynamic-plugin solution: https://github.com/kubevirt-ui/kubevirt-plugin/pull/478
const useSSHCommand = (vm: VMKind): useSSHCommandResult => {
  const [sshService] = useSSHService2(vm);

  const servicePort = sshService?.spec?.ports?.find(
    (port) => parseInt(port.targetPort, 10) === TARGET_PORT,
  )?.nodePort;

  const consoleHostname = window.location.hostname; // fallback to console hostname

  const user = getCloudInitValues(vm, 'user');

  let command = 'ssh ';
  if (user) command += `${user}@`;
  command += `${consoleHostname} -p ${servicePort}`;

  return {
    command,
    user,
    port: servicePort,
    isRoutesLoaded: true,
    loadingRoutesError: null,
  };
};

export default useSSHCommand;
