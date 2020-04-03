import { last, includes } from 'lodash';
import { getName } from '@console/shared';
import { ConfigMapKind, Volume } from '@console/internal/module/k8s';
import { PatchBuilder } from '@console/shared/src/k8s';
import { StorageType } from '../../../components/modals/cdrom-vm-modal/constants';
import { DataVolumeWrapper } from '../../wrapper/vm/data-volume-wrapper';
import {
  getDefaultSCAccessModes,
  getDefaultSCVolumeMode,
} from '../../../selectors/config-map/sc-defaults';
import { VMLikeEntityKind } from '../../../types/vmLike';
import {
  getVolumes,
  getDataVolumeTemplates,
  getDisks,
  getVolumeDataVolumeName,
  asVM,
  getBootableDevicesInOrder,
} from '../../../selectors/vm';
import { getVMLikePatches } from '../vm-template';
import { BOOT_ORDER_FIRST, BOOT_ORDER_SECOND } from '../../../constants';
import { CD } from '../../../components/modals/cdrom-vm-modal/types';

const getNextAvailableBootOrderIndex = (vm: VMLikeEntityKind) => {
  const sortedBootableDevices = getBootableDevicesInOrder(vm);
  const numBootableDevices = sortedBootableDevices.length;
  const lastBootableDevice: any = last(sortedBootableDevices);

  // assigned indexes start at two as the first index is assigned directly by the user
  return numBootableDevices > 0 ? lastBootableDevice.value.bootOrder + 1 : BOOT_ORDER_SECOND;
};

const assignBootOrderIndex = (vm: VMLikeEntityKind, currDevBootOrder = -1) => {
  let bootOrder = currDevBootOrder;
  if (currDevBootOrder !== BOOT_ORDER_FIRST) {
    bootOrder = getNextAvailableBootOrderIndex(vm);
  }
  return bootOrder;
};

export const getCDsPatch = (
  vm: VMLikeEntityKind,
  cds: CD[],
  storageClassConfigMap: ConfigMapKind,
) => {
  let newBootOrder = assignBootOrderIndex(asVM(vm));

  let DISKS = getDisks(asVM(vm)).filter(
    (disk) => !disk.cdrom || cds.find((modalCD) => disk.name === modalCD.name || modalCD.newCD),
  );
  let VOLS = getVolumes(asVM(vm)).filter((v) => DISKS.find((disk) => v.name === disk.name));
  let DATATEMPLATES = getDataVolumeTemplates(asVM(vm)).filter((dataVol) =>
    VOLS.find((vol) => getVolumeDataVolumeName(vol) === getName(dataVol)),
  );

  cds.forEach(
    ({ name, pvc, type, bootOrder, bus, container, windowsTools, url, storageClass, size }) => {
      const existingCD = !!bootOrder;

      const disk: CD = {
        name,
        bootOrder: existingCD ? bootOrder : newBootOrder,
        cdrom: { bus: bus || 'virtio' },
      };
      let volume: Volume = { name };
      let finalDataVolume;

      // Patches
      if (type === StorageType.PVC) {
        volume = {
          persistentVolumeClaim: {
            claimName: pvc,
          },
          name,
        };
      }

      if (type === StorageType.URL) {
        const newDataVolume = {
          metadata: {
            name: `${getName(vm)}-${name}`,
          },
          spec: {
            pvc: {
              accessModes: undefined,
              volumeMode: undefined,
              resources: {
                requests: {
                  storage: `${size}Gi`,
                },
              },
              storageClassName: storageClass,
            },
            source: { http: { url } },
          },
        };

        const dataVolumeWrapper = new DataVolumeWrapper(newDataVolume);
        const storageClassName = dataVolumeWrapper.getStorageClassName();

        finalDataVolume = dataVolumeWrapper
          .setVolumeMode(getDefaultSCVolumeMode(storageClassConfigMap, storageClassName))
          .setAccessModes(getDefaultSCAccessModes(storageClassConfigMap, storageClassName))
          .asResource();

        volume = {
          name,
          dataVolume: {
            name: `${getName(vm)}-${name}`,
          },
        };
      }
      if (type === StorageType.CONTAINER) {
        volume = { name, containerDisk: { image: container } };
      }
      if (type === StorageType.WINTOOLS) {
        volume = { name, containerDisk: { image: windowsTools } };
      }

      const restOfDisks = DISKS.filter((vol) => vol.name !== name);
      const restOfVolumes = VOLS.filter((vol) => vol.name !== name);

      let restOfDataTemplates = DATATEMPLATES;
      if (type !== StorageType.CONTAINER && VOLS.filter((vol) => !!vol.dataVolume).length > 0) {
        const isDataVolume = VOLS.find((vol) => vol.name === name);
        if (isDataVolume) {
          restOfDataTemplates = DATATEMPLATES.filter(
            (vol) => vol.metadata.name !== getVolumeDataVolumeName(isDataVolume),
          );
        }
      }

      DISKS = [...restOfDisks, disk];
      VOLS = [...restOfVolumes, volume];
      DATATEMPLATES = restOfDataTemplates;

      if (finalDataVolume) {
        DATATEMPLATES = [...restOfDataTemplates, finalDataVolume];
      }

      if (type !== StorageType.URL) {
        // remove unnecessary dataVolumeTemplates
        DATATEMPLATES = DATATEMPLATES.filter((dataVol) =>
          includes(
            VOLS.map((vol) => getVolumeDataVolumeName(vol)),
            dataVol.metadata.name,
          ),
        );
      }
      if (!existingCD) {
        newBootOrder++;
      }
    },
  );

  const patches = [
    new PatchBuilder('/spec/template/spec/domain/devices/disks').replace(DISKS).build(),
    new PatchBuilder('/spec/template/spec/volumes').replace(VOLS).build(),
    new PatchBuilder('/spec/dataVolumeTemplates').replace(DATATEMPLATES).build(),
  ].filter((patch) => patch);

  return getVMLikePatches(vm, () => patches);
};
