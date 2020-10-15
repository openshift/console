/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '@console/shared/src/constants/object-enum';
import { SelectDropdownObjectEnum } from '../../select-dropdown-object-enum';

export class DataVolumeSourceType extends SelectDropdownObjectEnum<string> {
  static readonly BLANK = new DataVolumeSourceType('blank', {
    label: 'Blank',
    description: 'Empty disk.',
  });
  static readonly HTTP = new DataVolumeSourceType('http', {
    label: 'Import via HTTP URL (creates PVC)',
    description: 'Import content via URL (HTTP endpoint).',
  });
  static readonly PVC = new DataVolumeSourceType('pvc', {
    label: 'Clone existing PVC',
    description:
      'Select an existing persistent volume claim already available on the cluster and clone it.',
  });
  static readonly REGISTRY = new DataVolumeSourceType('registry', {
    label: 'Import via Registry (creates PVC)',
    description: 'Import content via container registry.',
  });
  static readonly S3 = new DataVolumeSourceType('s3', {
    label: 'Import via S3 URL (creates PVC)',
    description: 'Import content via URL (S3 endpoint).',
  });
  static readonly UPLOAD = new DataVolumeSourceType('upload', {
    label: 'Upload local file (creates PVC)',
    description: 'Upload file from your local device (supported types - gz, xz, tar, qcow2).',
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

  static getBootSourceTypes = () => [
    DataVolumeSourceType.UPLOAD,
    DataVolumeSourceType.HTTP,
    DataVolumeSourceType.REGISTRY,
    DataVolumeSourceType.PVC,
  ];

  static fromString = (model: string): DataVolumeSourceType =>
    DataVolumeSourceType.stringMapper[model];
}
