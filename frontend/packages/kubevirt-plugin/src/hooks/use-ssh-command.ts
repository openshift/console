import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { NodeModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getCloudInitValues, TARGET_PORT } from '../components/ssh-service/SSHForm/ssh-form-utils';
import { VMIKind } from '../types';
import { useSSHService2 } from './use-ssh-service';

export type useSSHCommandResult = {
  command: string;
  user: string;
  port: number;
  isRoutesLoaded: boolean;
  loadingRoutesError: string;
};

// based on dynamic-plugin solution: https://github.com/kubevirt-ui/kubevirt-plugin/pull/478
const useSSHCommand = (vmi: VMIKind): useSSHCommandResult => {
  const [sshService] = useSSHService2(vmi);
  const [node, loaded, error] = useK8sWatchResource<K8sResourceKind>({
    kind: NodeModel.kind,
    isList: false,
    name: vmi?.status?.nodeName,
  });

  const servicePort = sshService?.spec?.ports?.find(
    (port) => parseInt(port.targetPort, 10) === TARGET_PORT,
  )?.nodePort;
  const nodeInternalIPAddress = node?.status?.addresses?.find(
    (address) => address.type === 'InternalIP',
  )?.address;

  const consoleHostname = window.location.hostname; // fallback to console hostname

  const user = getCloudInitValues(vmi, 'user');
  const command = `ssh ${user && `${user}@`}${nodeInternalIPAddress ||
    consoleHostname} -p ${servicePort}`;

  return {
    command,
    user,
    port: servicePort,
    isRoutesLoaded: loaded,
    loadingRoutesError: error,
  };
};

export default useSSHCommand;
