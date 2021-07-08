import { PatchBuilder } from '@console/shared/src/k8s';
import { ANNOTATION_FIRST_BOOT, BOOT_ORDER_FIRST, BOOT_ORDER_SECOND } from '../../../constants/vm';
import { getAnnotations } from '../../../selectors/selectors';
import { getBootDeviceIndex, getDisks, getInterfaces } from '../../../selectors/vm';
import { VMKind } from '../../../types/vm';

export const getBootPatch = (vm: VMKind) => {
  const patches = [];
  const annotations = getAnnotations(vm);
  if (annotations && annotations[ANNOTATION_FIRST_BOOT]) {
    if (annotations[ANNOTATION_FIRST_BOOT] === 'true') {
      patches.push(
        new PatchBuilder('/metadata/annotations')
          .setObjectUpdate(ANNOTATION_FIRST_BOOT, 'false', annotations)
          .build(),
      );
    } else {
      const disks = getDisks(vm);
      const interfaces = getInterfaces(vm);
      // find bootable disk and change boot order
      const bootableDiskIndex = getBootDeviceIndex(disks, BOOT_ORDER_SECOND, (d) => !d.cdrom);
      const bootableInterfaceIndex = getBootDeviceIndex(interfaces, BOOT_ORDER_FIRST);
      const bootableCDRomIndex = getBootDeviceIndex(disks, BOOT_ORDER_FIRST, (d) => !!d.cdrom);

      let bootableDevice;
      if (bootableInterfaceIndex !== -1) {
        bootableDevice = {
          index: bootableInterfaceIndex,
          type: 'interfaces',
        };
      } else if (bootableCDRomIndex !== -1) {
        bootableDevice = {
          index: bootableCDRomIndex,
          type: 'disks',
        };
      }

      if (bootableDiskIndex !== -1 && bootableDevice) {
        patches.push(
          new PatchBuilder(
            `/spec/template/spec/domain/devices/disks/${bootableDiskIndex}/bootOrder`,
          )
            .replace(BOOT_ORDER_FIRST)
            .build(),

          new PatchBuilder(
            `/spec/template/spec/domain/devices/${bootableDevice.type}/${bootableDevice.index}/bootOrder`,
          )
            .remove()
            .build(),
        );
      }
    }
  }
  return patches;
};
