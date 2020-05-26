import { CD } from './types';
import { VMILikeEntityKind } from '../../../types/vmLike';
import { initialDisk, WINTOOLS_CONTAINER_NAMES, StorageType } from './constants';
import {
  getContainerImageByDisk,
  getURLSourceByDisk,
  getStorageClassNameByDisk,
  getStorageSizeByDisk,
  getPVCSourceByDisk,
} from '../../../selectors/vm/selectors';
import { asVM } from '../../../selectors/vm/vmlike';
import { VirtualMachineModel } from '../../../models';
import * as _ from 'lodash';
import { VMKind, VMIKind } from '../../../types/vm';
import { K8sResourceKind } from '../../../../../../public/module/k8s/types';
import {
  getVMIURLSourceByDisk,
  getVMIDataVolumeNameByDisk,
} from '../../../selectors/vmi/selectors';
import {
  getDataVolumeStorageClassName,
  getDataVolumeStorageSize,
} from '../../../selectors/dv/selectors';

export const getAvailableCDName = (cds: CD[]) => {
  const cdSet = new Set(cds.map((cd) => cd.name));
  let index = 1;
  while (cdSet.has(`cd-drive-${index}`)) {
    index++;
  }
  return `cd-drive-${index}`;
};

const getCDVMIDataVolumes = (
  cds: CD[],
  vm: VMILikeEntityKind,
  dataVolumes?: K8sResourceKind[],
): { [name: string]: K8sResourceKind } => {
  if (dataVolumes && vm.kind !== VirtualMachineModel.kind) {
    return Object.assign(
      {},
      ...cds.map(({ name }) => {
        const dvName = getVMIDataVolumeNameByDisk(vm as VMIKind, name);
        const dvObj = dataVolumes.find((dv) => dv.metadata.name === dvName);

        return { [name]: dvObj };
      }),
    );
  }

  return Object.assign(
    {},
    ...cds.map(({ name }) => {
      return { [name]: null };
    }),
  );
};

export const mapCDsToSource = (
  cds: CD[],
  vm: VMILikeEntityKind,
  dataVolumes?: K8sResourceKind[],
) => {
  const vmiDVs = getCDVMIDataVolumes(cds, vm, dataVolumes);
  return Object.assign(
    {},
    ...cds.map(({ name, cdrom, bootOrder }) => {
      let cd: CD = {
        ...initialDisk,
        name,
        cdrom,
        bootOrder,
      };
      const container = getContainerImageByDisk(vm, name);
      if (container) {
        if (_.includes(WINTOOLS_CONTAINER_NAMES, container)) {
          cd = {
            ...cd,
            type: StorageType.WINTOOLS,
            windowsTools: container,
          };
        } else {
          cd = { ...cd, type: StorageType.CONTAINER, container };
        }
      }

      const url =
        vm.kind === VirtualMachineModel.kind
          ? getURLSourceByDisk(vm as VMKind, name)
          : getVMIURLSourceByDisk(vmiDVs[name]);

      if (url) {
        const storageClass =
          vm.kind === VirtualMachineModel.kind
            ? getStorageClassNameByDisk(asVM(vm), name)
            : getDataVolumeStorageClassName(vmiDVs[name]);

        const size =
          vm.kind === VirtualMachineModel.kind
            ? getStorageSizeByDisk(asVM(vm), cd.name).replace(/[^0-9]/g, '')
            : getDataVolumeStorageSize(vmiDVs[name]).replace(/[^0-9]/g, '');
        cd = { ...cd, type: StorageType.URL, url, storageClass, size };
      }

      const pvc = getPVCSourceByDisk(vm, name);
      if (pvc) {
        cd = {
          ...cd,
          type: StorageType.PVC,
          pvc,
        };
      }

      return { [name]: cd };
    }),
  );
};
