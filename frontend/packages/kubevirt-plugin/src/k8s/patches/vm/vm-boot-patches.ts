import { getAnnotations } from '@console/shared';
import { PatchBuilder } from '@console/shared/src/k8s';
import { ANNOTATION_FIRST_BOOT, BOOT_ORDER_FIRST, BOOT_ORDER_SECOND } from '../../../constants/vm';
import { getBootDeviceIndex, getDisks, getInterfaces } from '../../../selectors/vm';
import { VMKind } from '../../../types/vm';

export const getPxeBootPatch = (vm: VMKind) => {
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
      // find bootable disk and change boot order
      const bootableDiskIndex = getBootDeviceIndex(getDisks(vm), BOOT_ORDER_SECOND);
      const bootableInterfaceIndex = getBootDeviceIndex(getInterfaces(vm), BOOT_ORDER_FIRST);

      if (bootableDiskIndex !== -1 && bootableInterfaceIndex !== -1) {
        patches.push(
          new PatchBuilder(
            `/spec/template/spec/domain/devices/disks/${bootableDiskIndex}/bootOrder`,
          )
            .replace(BOOT_ORDER_FIRST)
            .build(),

          new PatchBuilder(
            `/spec/template/spec/domain/devices/interfaces/${bootableInterfaceIndex}/bootOrder`,
          )
            .remove()
            .build(),
        );
      }
    }
  }
  return patches;
};
