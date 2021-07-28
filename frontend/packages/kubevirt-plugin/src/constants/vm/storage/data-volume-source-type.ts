/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '../../object-enum';
import { SelectDropdownObjectEnum } from '../../select-dropdown-object-enum';

export class DataVolumeSourceType extends SelectDropdownObjectEnum<string> {
  static readonly BLANK = new DataVolumeSourceType('blank', {
    // t('kubevirt-plugin~Blank (creates PVC)')
    labelKey: 'kubevirt-plugin~Blank (creates PVC)',
    // t('kubevirt-plugin~Create an empty disk.')
    descriptionKey: 'kubevirt-plugin~Create an empty disk.',
  });
  static readonly HTTP = new DataVolumeSourceType('http', {
    // t('kubevirt-plugin~Import via URL (creates PVC)')
    labelKey: 'kubevirt-plugin~Import via URL (creates PVC)',
    // t('kubevirt-plugin~Import content via URL (HTTP or S3 endpoint).')
    descriptionKey: 'kubevirt-plugin~Import content via URL (HTTP or S3 endpoint).',
  });
  static readonly PVC = new DataVolumeSourceType('pvc', {
    // t('kubevirt-plugin~Clone existing PVC (creates PVC)')
    labelKey: 'kubevirt-plugin~Clone existing PVC (creates PVC)',
    // t('kubevirt-plugin~Select an existing persistent volume claim already available on the cluster and clone it.')
    descriptionKey:
      'kubevirt-plugin~Select an existing persistent volume claim already available on the cluster and clone it.',
  });
  static readonly REGISTRY = new DataVolumeSourceType('registry', {
    // t('kubevirt-plugin~Import via Registry (creates PVC)')
    labelKey: 'kubevirt-plugin~Import via Registry (creates PVC)',
    // t('kubevirt-plugin~Import content via container registry.')
    descriptionKey: 'kubevirt-plugin~Import content via container registry.',
  });
  static readonly S3 = new DataVolumeSourceType('s3', {
    // t('kubevirt-plugin~Import via S3 URL (creates PVC)')
    labelKey: 'kubevirt-plugin~Import via S3 URL (creates PVC)',
    // t('kubevirt-plugin~Import content via URL (S3 endpoint).')
    descriptionKey: 'kubevirt-plugin~Import content via URL (S3 endpoint).',
  });
  static readonly UPLOAD = new DataVolumeSourceType('upload', {
    // t('kubevirt-plugin~Upload local file (creates PVC)')
    labelKey: 'kubevirt-plugin~Upload local file (creates PVC)',
    // t('kubevirt-plugin~Upload file from your local device (supported types - gz, xz, tar, qcow2).')
    descriptionKey:
      'kubevirt-plugin~Upload file from your local device (supported types - gz, xz, tar, qcow2).',
  });

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<DataVolumeSourceType>(DataVolumeSourceType),
  );

  private static readonly stringMapper = DataVolumeSourceType.ALL.reduce(
    (accumulator, dataVolumeSourceType: DataVolumeSourceType) => ({
      ...accumulator,
      [dataVolumeSourceType.value]: dataVolumeSourceType,
    }),
    {},
  );

  static getAll = () => DataVolumeSourceType.ALL;

  static fromString = (model: string): DataVolumeSourceType =>
    DataVolumeSourceType.stringMapper[model];
}
