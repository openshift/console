import { ServiceModel } from '@console/internal/models';
import { k8sCreate, k8sKill } from '@console/internal/module/k8s';
import { VMIKind, VMKind } from '@console/kubevirt-plugin/src/types';
import {
  CLOUD_INIT_CONFIG_DRIVE,
  CLOUD_INIT_NO_CLOUD,
  CLOUDINIT_DISK,
} from '../../../constants/vm/constants';
import { CloudInitDataHelper } from '../../../k8s/wrapper/vm/cloud-init-data-helper';

export const AUTHORIZED_SSH_KEYS = 'authorizedsshkeys';

export enum ValidatedOptions {
  success = 'success',
  error = 'error',
  default = 'default',
}

export const inputValidation = {
  ...ValidatedOptions,
  warning: 'warning',
};

export const PORT = 22000;
export const TARGET_PORT = 22;

export const getCloudInitValues = (vm: VMKind | VMIKind, field: string) => {
  const volume = vm?.spec?.template?.spec?.volumes?.find(({ name }) => name === CLOUDINIT_DISK);
  const selector =
    (volume?.hasOwnProperty(CLOUD_INIT_CONFIG_DRIVE) && CLOUD_INIT_CONFIG_DRIVE) ||
    (volume?.hasOwnProperty(CLOUD_INIT_NO_CLOUD) && CLOUD_INIT_NO_CLOUD);
  const cloudInit = new CloudInitDataHelper(volume?.[selector]);
  return cloudInit.get(field);
};

// This function should be in useSSHService hook, once advance wizard will be adjusted this can be moved.
export const createOrDeleteSSHService = async (
  { metadata }: VMKind | VMIKind,
  enableSSHService: boolean,
) => {
  const createOrDelete = enableSSHService ? k8sCreate : k8sKill;
  try {
    await createOrDelete(ServiceModel, {
      kind: ServiceModel.kind,
      apiVersion: ServiceModel.apiVersion,
      metadata: {
        name: `${metadata?.name}-ssh-service`,
        namespace: metadata?.namespace,
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
};
