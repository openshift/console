import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch } from 'react-redux';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ServiceModel } from '@console/internal/models';
import { sshActions, SSHActionsNames } from '../components/ssh-service/redux/actions';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { VMIKind, VMKind } from '@console/kubevirt-plugin/src/types';
import { useActiveNamespace } from '@console/shared';
import { getServicePort } from '../selectors/service/selectors';
import useSSHSelectors from './use-ssh-selectors';
import {
  TARGET_PORT,
  createOrDeleteSSHService,
} from '../components/ssh-service/SSHForm/ssh-form-utils';

export type useSSHServiceResult = {
  sshServices: { running: boolean; port: number };
  createOrDeleteSSHService: (vm: VMKind | VMIKind) => void;
};

const useSSHService = (vm?: VMKind | VMIKind): useSSHServiceResult => {
  const dispatch = useDispatch();
  const { metadata } = vm || {};
  const [activeNamespace] = useActiveNamespace();
  const namespace = metadata?.namespace || activeNamespace;

  const { sshServices, enableSSHService } = useSSHSelectors();

  const sshServiceModal = React.useMemo(
    () => ({
      kind: ServiceModel.kind,
      isList: true,
      namespace,
    }),
    [namespace],
  );

  const [services, isServicesLoaded] = useK8sWatchResource<K8sResourceKind[]>(sshServiceModal);

  React.useEffect(() => {
    if (metadata?.name && isServicesLoaded) {
      const service = services.find(
        ({ metadata: serviceMetadata }) =>
          serviceMetadata?.name === `${metadata?.name}-ssh-service`,
      );
      dispatch(
        sshActions[SSHActionsNames.updateSSHServices](
          !!service,
          getServicePort(service, TARGET_PORT)?.nodePort,
          metadata?.name,
        ),
      );
    }
  }, [metadata, services, isServicesLoaded, dispatch]);

  const createOrDeleteSSHServiceWithEnableSSHService = (virtualMachine: VMKind | VMIKind) =>
    createOrDeleteSSHService(virtualMachine, enableSSHService);

  return {
    sshServices: sshServices?.[metadata?.name],
    createOrDeleteSSHService: createOrDeleteSSHServiceWithEnableSSHService,
  };
};

export default useSSHService;
