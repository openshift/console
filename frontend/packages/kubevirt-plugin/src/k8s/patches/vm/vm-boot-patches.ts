import * as _ from 'lodash';

import { ANNOTATION_FIRST_BOOT, BOOT_ORDER_FIRST, BOOT_ORDER_SECOND } from '../../../constants/vm';
import { getBootDeviceIndex, getDisks, getInterfaces } from '../../../selectors/vm';
import { VMKind } from '../../../types/vm';
import { patchSafeValue } from '../../utils';

export const getPxeBootPatch = (vm: VMKind) => {
  const patches = [];
  const annotations = _.get(vm, 'metadata.annotations', {});
  if (annotations[ANNOTATION_FIRST_BOOT]) {
    if (annotations[ANNOTATION_FIRST_BOOT] === 'true') {
      patches.push({
        op: 'replace',
        path: `/metadata/annotations/${patchSafeValue(ANNOTATION_FIRST_BOOT)}`,
        value: 'false',
      });
    } else {
      // find bootable disk and change boot order
      const bootableDiskIndex = getBootDeviceIndex(getDisks(vm), BOOT_ORDER_SECOND);
      const bootableInterfaceIndex = getBootDeviceIndex(getInterfaces(vm), BOOT_ORDER_FIRST);

      if (bootableDiskIndex !== -1 && bootableInterfaceIndex !== -1) {
        patches.push(
          {
            op: 'replace',
            path: `/spec/template/spec/domain/devices/disks/${bootableDiskIndex}/bootOrder`,
            value: BOOT_ORDER_FIRST,
          },
          {
            op: 'remove',
            path: `/spec/template/spec/domain/devices/interfaces/${bootableInterfaceIndex}/bootOrder`,
          },
        );
      }
    }
  }
  return patches;
};
