import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { RouteModel } from '@console/internal/models';
import { ListKind, RouteKind } from '@console/internal/module/k8s';
import { VMIKind, VMKind } from '@console/kubevirt-plugin/src/types';
import { getCloudInitValues } from '../components/ssh-service/SSHForm/ssh-form-utils';
import useSSHService from './use-ssh-service';

const DEFAULT = 'default';

export type useSSHCommandResult = {
  command: string;
  user: string;
  port: number;
  isRoutesLoaded: boolean;
  loadingRoutesError: string;
};

const useSSHCommand = (vm: VMKind | VMIKind): useSSHCommandResult => {
  const { sshServices } = useSSHService(vm);
  const [allRoutes, isRoutesLoaded, loadingRoutesError] = useK8sGet<ListKind<RouteKind>>(
    RouteModel,
    null,
    'openshift-console',
  );

  // Temp fix for routes
  const route = allRoutes?.items?.[0]?.spec?.host?.replace(/.*apps/, 'api');
  const user = getCloudInitValues(vm, 'user') || DEFAULT;

  const command = `ssh ${user !== DEFAULT ? user : `<${DEFAULT}>`}@${route} -p ${
    sshServices?.port
  }`;

  return { command, user, port: sshServices?.port, isRoutesLoaded, loadingRoutesError };
};

export default useSSHCommand;
