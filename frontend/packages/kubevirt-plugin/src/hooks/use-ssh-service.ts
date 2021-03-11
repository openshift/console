import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch, useSelector, RootStateOrAny } from 'react-redux';
import { K8sResourceKind, k8sCreate } from '@console/internal/module/k8s';
import { ServiceModel } from '@console/internal/models';
import { sshActions, SSHActionsNames } from '../components/ssh-service/redux/actions';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { VMIKind, VMKind } from '@console/kubevirt-plugin/src/types';
import { useActiveNamespace } from '@console/shared';

const PORT = 22000;
const TARGET_PORT = 22;

type SSHReduxStructure = {
  isSSHServiceRunning: string | null;
};

export const useSSHService = (vm: VMIKind | VMKind) => {
  const dispatch = useDispatch();
  const { metadata } = vm || {};
  const [activeNamespace] = useActiveNamespace();
  const namespace = activeNamespace || metadata?.namespace;
  const { isSSHServiceRunning } = useSelector(
    (state: RootStateOrAny): SSHReduxStructure => ({
      isSSHServiceRunning:
        state?.plugins?.kubevirt?.authorizedSSHKeys?.isSSHServiceRunning?.[metadata?.name],
    }),
  );

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
    metadata?.name &&
      isServicesLoaded &&
      dispatch(
        sshActions[SSHActionsNames.updateIsSSHServiceRunning](
          !!services.find(
            ({ metadata: serviceMetadata }) =>
              serviceMetadata?.name === `${metadata?.name}-ssh-service`,
          ),
          metadata?.name,
        ),
      );
  }, [metadata, services, isServicesLoaded, dispatch]);

  const createSSHService = React.useCallback(async () => {
    try {
      await k8sCreate(ServiceModel, {
        kind: ServiceModel.kind,
        apiVersion: ServiceModel.apiVersion,
        metadata: {
          name: `${metadata?.name}-ssh-service`,
          namespace,
        },
        spec: {
          ports: [
            {
              port: PORT,
              targetPort: TARGET_PORT,
            },
          ],
          type: 'NodePort',
          selector: {
            ...Object.fromEntries(
              Object.entries(metadata?.labels).filter(
                ([objectKey]) => !objectKey.startsWith('vm') && !objectKey.startsWith('app'),
              ),
            ),
            'kubevirt.io/domain': metadata?.name,
            'vm.kubevirt.io/name': metadata?.name,
          },
        },
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e.message);
    }
  }, [metadata, namespace]);

  return {
    isSSHServiceRunning,
    createSSHService,
  };
};
