import { k8sCreate, k8sKill } from '@console/dynamic-plugin-sdk/dist/core/lib/utils/k8s';
import { ServiceModel } from '@console/internal/models';
import {
  CLOUD_INIT_CONFIG_DRIVE,
  CLOUD_INIT_NO_CLOUD,
  CLOUDINIT_DISK,
} from '../../../constants/vm/constants';
import { CloudInitDataHelper } from '../../../k8s/wrapper/vm/cloud-init-data-helper';
import { VMKind } from '../../../types/vm';
import { VMIKind } from '../../../types/vmi';
import { buildOwnerReference } from '../../../utils/utils';

export const PORT = 22000;
export const TARGET_PORT = 22;

export const getCloudInitValues = (vmi: VMIKind, field: string) => {
  const volume = vmi?.spec?.volumes?.find(({ name }) => name === CLOUDINIT_DISK);
  const selector =
    (volume?.hasOwnProperty(CLOUD_INIT_CONFIG_DRIVE) && CLOUD_INIT_CONFIG_DRIVE) ||
    (volume?.hasOwnProperty(CLOUD_INIT_NO_CLOUD) && CLOUD_INIT_NO_CLOUD);
  const cloudInit = new CloudInitDataHelper(volume?.[selector]);
  return cloudInit.get(field);
};

export const createOrDeleteSSHService = async (
  virtualMachine: VMKind | VMIKind,
  enableSSHService: boolean,
) => {
  const metadata = virtualMachine?.metadata;
  const createOrDelete = enableSSHService ? k8sCreate : k8sKill;
  try {
    await createOrDelete(ServiceModel, {
      kind: ServiceModel.kind,
      apiVersion: ServiceModel.apiVersion,
      metadata: {
        name: `${metadata?.name}-ssh-service`,
        namespace: metadata?.namespace,
        ownerReferences: [buildOwnerReference(virtualMachine, { blockOwnerDeletion: false })],
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
          'vm.kubevirt.io/name': metadata?.name,
        },
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(`Failed to ${enableSSHService ? 'create' : 'delete'} SSH service:`, e.message);
  }
};
