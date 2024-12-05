import { ObjectEnum } from './object-enum';
import { StatusSimpleLabel } from './status-constants';
import { StatusEnum } from './status-enum';
import { StatusGroup } from './status-group';

export class V2VVMImportStatus extends StatusEnum {
  static readonly ERROR = new V2VVMImportStatus('V2VVMImportStatus_ERROR', 'Import error', {
    isError: true,
    group: StatusGroup.VMIMPORT,
  });

  static readonly COMPLETE = new V2VVMImportStatus(
    'V2VVMImportStatus_COMPLETE',
    'Import complete',
    {
      isCompleted: true,
      group: StatusGroup.VMIMPORT,
    },
  );

  static readonly PENDING = new V2VVMImportStatus('V2VVMImportStatus_PENDING', 'Import pending', {
    isPending: true,
    group: StatusGroup.VMIMPORT,
  });

  static readonly IN_PROGRESS = new V2VVMImportStatus(
    'V2VVMImportStatus_IN_PROGRESS',
    StatusSimpleLabel.Importing,
    {
      isImporting: true,
      group: StatusGroup.VMIMPORT,
    },
  );

  static readonly UNKNOWN = new V2VVMImportStatus('V2VVMImportStatus_UNKNOWN', 'Unknown', {
    isUnknown: true,
    group: StatusGroup.VMIMPORT,
  });

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<V2VVMImportStatus>(V2VVMImportStatus),
  );

  private static readonly stringMapper = V2VVMImportStatus.ALL.reduce(
    (accumulator, type: V2VVMImportStatus) => ({
      ...accumulator,
      [type.value]: type,
    }),
    {},
  );

  static getAll = () => V2VVMImportStatus.ALL;

  static fromString = (model: string): V2VVMImportStatus => V2VVMImportStatus.stringMapper[model];
}
