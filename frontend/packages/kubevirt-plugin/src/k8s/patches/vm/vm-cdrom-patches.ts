import { last, includes } from 'lodash';
import { getName } from '@console/shared';
import { Volume, k8sGet } from '@console/internal/module/k8s';
import { PatchBuilder, PatchOperation } from '@console/shared/src/k8s';
import { StorageType } from '../../../components/modals/cdrom-vm-modal/constants';
import { MutableDataVolumeWrapper } from '../../wrapper/vm/data-volume-wrapper';
import {
  getDefaultSCAccessModes,
  getDefaultSCVolumeMode,
} from '../../../selectors/config-map/sc-defaults';
import { getStorageClassConfigMap } from '../../requests/config-map/storage-class';
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
import { BOOT_ORDER_FIRST, BOOT_ORDER_SECOND, DiskBus } from '../../../constants';
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

export const getCDsPatch = async (vm: VMLikeEntityKind, cds: CD[]) => {
  let newBootOrder = assignBootOrderIndex(asVM(vm));

  let DISKS = getDisks(asVM(vm)).filter(
    (disk) => !disk.cdrom || cds.find((modalCD) => disk.name === modalCD.name || modalCD.newCD),
  );
  let VOLS = getVolumes(asVM(vm)).filter((v) => DISKS.find((disk) => v.name === disk.name));
  let DATATEMPLATES = getDataVolumeTemplates(asVM(vm)).filter((dataVol) =>
    VOLS.find((vol) => getVolumeDataVolumeName(vol) === getName(dataVol)),
  );
  const storageClassConfigMap = await getStorageClassConfigMap({ k8sGet });

  cds.forEach(
    ({ name, pvc, type, bootOrder, bus, container, windowsTools, url, storageClass, size }) => {
      const existingCD = !!bootOrder;

      const disk: CD = {
        name,
        bootOrder: existingCD ? bootOrder : newBootOrder,
        cdrom: { bus: bus || DiskBus.SATA.getValue() },
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

        const dataVolumeWrapper = new MutableDataVolumeWrapper(newDataVolume);
        const storageClassName = dataVolumeWrapper.getStorageClassName();

        finalDataVolume = dataVolumeWrapper
          .assertDefaultModes(
            getDefaultSCVolumeMode(storageClassConfigMap, storageClassName),
            getDefaultSCAccessModes(storageClassConfigMap, storageClassName),
          )
          .asMutableResource();

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
    new PatchBuilder('/spec/template/spec/domain/devices/disks')
      .setOperation(PatchOperation.REPLACE)
      .setValue(DISKS)
      .build(),
    new PatchBuilder('/spec/template/spec/volumes')
      .setOperation(PatchOperation.REPLACE)
      .setValue(VOLS)
      .build(),
    new PatchBuilder('/spec/dataVolumeTemplates')
      .setOperation(PatchOperation.REPLACE)
      .setValue(DATATEMPLATES)
      .build(),
  ].filter((patch) => patch);

  return getVMLikePatches(vm, () => patches);
};
