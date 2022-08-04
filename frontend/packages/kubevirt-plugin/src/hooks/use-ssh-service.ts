import * as React from 'react';
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

const getServicesForVmi = (services: K8sResourceKind[], vmi: VMIKind): K8sResourceKind[] => {
  const vmLabels = vmi?.metadata?.labels;

  if (!vmLabels) return [];

  return services?.filter((service) => {
    const selectors = service?.spec?.selector || {};
    return Object?.keys(selectors)?.every((key) => vmLabels?.[key] === selectors?.[key]);
  });
};

// bz: https://bugzilla.redhat.com/show_bug.cgi?id=2090178
export const useSSHService2 = (vmi: VMIKind) => {
  const [services, servicesLoaded, servicesError] = useK8sWatchResource<K8sResourceKind[]>({
    kind: ServiceModel.kind,
    isList: true,
    namespace: vmi?.metadata?.namespace,
  });

  const vmiServices = getServicesForVmi(services, vmi);

  const sshVMIService = vmiServices.find((service) =>
    service?.spec?.ports?.find((port) => parseInt(port.targetPort, 10) === TARGET_PORT),
  );

  return [sshVMIService, servicesLoaded || servicesError];
};
