import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch } from 'react-redux';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ServiceModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useActiveNamespace } from '@console/shared';
import { sshActions, SSHActionsNames } from '../components/ssh-service/redux/actions';
import {
  createOrDeleteSSHService,
  TARGET_PORT,
} from '../components/ssh-service/SSHForm/ssh-form-utils';
import { getServicePort } from '../selectors/service/selectors';
import { VMIKind, VMKind } from '../types';
import useSSHSelectors from './use-ssh-selectors';

export type useSSHServiceResult = {
  sshServices: { running: boolean; port: number; serviceName: string };
  createOrDeleteSSHService: (vm: VMKind | VMIKind) => void;
};

const compareSelectorsToVMLabels = (
  selectors: { [key: string]: string },
  vmLabels: { [key: string]: string },
): boolean => {
  if (!selectors || Object.keys(selectors).length === 0) return false;

  let selectorsEquals = true;

  for (const [key, value] of Object.entries(selectors)) {
    if (value !== vmLabels?.[key]) selectorsEquals = false;
  }

  return selectorsEquals;
};

const useSSHService = (vm?: VMIKind): useSSHServiceResult => {
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
      const sshService = services.find(
        (service) =>
          compareSelectorsToVMLabels(service?.spec?.selector, metadata.labels) &&
          service?.spec?.ports?.find((port) => parseInt(port.targetPort, 10) === TARGET_PORT),
      );
      dispatch(
        sshActions[SSHActionsNames.updateSSHServices](
          !!sshService,
          getServicePort(sshService, TARGET_PORT)?.nodePort,
          metadata?.name,
          sshService?.metadata?.name,
        ),
      );
    }
  }, [metadata, services, isServicesLoaded, dispatch]);

  const createOrDeleteSSHServiceWithEnableSSHService = (virtualMachine: VMKind | VMIKind) =>
    createOrDeleteSSHService(
      virtualMachine,
      enableSSHService,
      sshServices?.[metadata?.name]?.serviceName,
    );

  return {
    sshServices: sshServices?.[metadata?.name],
    createOrDeleteSSHService: createOrDeleteSSHServiceWithEnableSSHService,
  };
};

export default useSSHService;
