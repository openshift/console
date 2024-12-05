/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '../../object-enum';
import { SelectDropdownObjectEnum } from '../../select-object-dropdown-enum';

export class DiskBus extends SelectDropdownObjectEnum<string> {
  static readonly VIRTIO = new DiskBus('virtio', {
    // t('kubevirt-plugin~virtio')
    labelKey: 'kubevirt-plugin~virtio',
    // t('kubevirt-plugin~Optimized for best performance. Supported by most Linux distributions. Windows requires additional drivers to use this model')
    descriptionKey:
      'kubevirt-plugin~Optimized for best performance. Supported by most Linux distributions. Windows requires additional drivers to use this model.',
  });
  static readonly SATA = new DiskBus('sata', {
    // t('kubevirt-plugin~sata')
    labelKey: 'kubevirt-plugin~sata',
    // t('kubevirt-plugin~Supported by most operating systems including Windows out of the box. Offers lower performance compared to virtio. Consider using it for CD-ROM devices')
    descriptionKey:
      'kubevirt-plugin~Supported by most operating systems including Windows out of the box. Offers lower performance compared to virtio. Consider using it for CD-ROM devices.',
  });
  static readonly SCSI = new DiskBus('scsi', {
    // t('kubevirt-plugin~scsi')
    labelKey: 'kubevirt-plugin~scsi',
    // t('kubevirt-plugin~Paravirtualized iSCSI HDD driver offers similar functionality to the virtio-block device, with some additional enhancements. In particular, this driver supports adding hundreds of devices, and names devices using the standard SCSI device naming scheme')
    descriptionKey:
      'kubevirt-plugin~Paravirtualized iSCSI HDD driver offers similar functionality to the virtio-block device, with some additional enhancements. In particular, this driver supports adding hundreds of devices, and names devices using the standard SCSI device naming scheme.',
  });

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<DiskBus>(DiskBus),
  );

  private static readonly stringMapper = DiskBus.ALL.reduce(
    (accumulator, diskBusType: DiskBus) => ({
      ...accumulator,
      [diskBusType.value]: diskBusType,
    }),
    {},
  );

  static getAll = () => DiskBus.ALL;

  static fromString = (model: string): DiskBus => DiskBus.stringMapper[model];
}
