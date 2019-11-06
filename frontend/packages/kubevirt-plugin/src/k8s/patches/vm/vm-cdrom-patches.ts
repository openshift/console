import { last, includes } from 'lodash';
import {
  BOOT_ORDER_SECOND,
  BOOT_ORDER_FIRST,
  getBootableDevicesInOrder,
} from 'kubevirt-web-ui-components';
import { getName } from '@console/shared';
import { Volume, k8sGet } from '@console/internal/module/k8s';
import { CD, StorageType } from '../../../components/modals/cdrom-vm-modal/constants';
import { DataVolumeWrapper } from '../../wrapper/vm/data-volume-wrapper';
import {
  getDefaultSCAccessMode,
  getDefaultSCVolumeMode,
} from '../../../selectors/config-map/sc-defaults';
import { getStorageClassConfigMap } from '../../requests/config-map/storage-class';
import { PatchBuilder, PatchOperation } from '../../utils/patch';
import { VMLikeEntityKind } from '../../../types';
import {
  getVolumes,
  getDataVolumeTemplates,
  getDisks,
  getVolumeDataVolumeName,
  asVM,
} from '../../../selectors/vm';
import { getVMLikePatches } from '../vm-template';

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
  let DISKS = getDisks(asVM(vm));
  let VOLS = getVolumes(asVM(vm));
  let DATATEMPLATES = getDataVolumeTemplates(asVM(vm));
  const storageClassConfigMap = await getStorageClassConfigMap({ k8sGet });

  cds
    .filter((cd) => cd.changed)
    .forEach(
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

          const dataVolumeWrapper = DataVolumeWrapper.initialize(newDataVolume);
          const storageClassName = dataVolumeWrapper.getStorageClassName();

          finalDataVolume = DataVolumeWrapper.mergeWrappers(
            DataVolumeWrapper.initializeFromSimpleData({
              accessModes: [getDefaultSCAccessMode(storageClassConfigMap, storageClassName)],
              volumeMode: getDefaultSCVolumeMode(storageClassConfigMap, storageClassName),
            }),
            dataVolumeWrapper,
          ).asResource();

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
            includes(VOLS.map((vol) => getVolumeDataVolumeName(vol)), dataVol.metadata.name),
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
