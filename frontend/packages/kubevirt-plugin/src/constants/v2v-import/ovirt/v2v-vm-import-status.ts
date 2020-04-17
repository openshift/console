/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '../../object-enum';
import { StatusEnum } from '../../status-enum';

export class V2VVMImportStatus extends StatusEnum {
  static readonly ERROR = new V2VVMImportStatus(
    'V2VVMImportStatus_ERROR',
    'Import error (Red Hat Virtualization)',
    { isError: true },
  );
  static readonly COMPLETE = new V2VVMImportStatus(
    'V2VVMImportStatus_COMPLETE',
    'Import complete (Red Hat Virtualization)',
    {
      isCompleted: true,
    },
  );
  static readonly PENDING = new V2VVMImportStatus(
    'V2VVMImportStatus_PENDING',
    'Import pending (Red Hat Virtualization)',
    {
      isPending: true,
    },
  );
  static readonly IN_PROGRESS = new V2VVMImportStatus(
    'V2VVMImportStatus_IN_PROGRESS',
    'Importing (Red Hat Virtualization)',
    {
      isImporting: true,
    },
  );
  static readonly UNKNOWN = new V2VVMImportStatus('V2VVMImportStatus_UNKNOWN', 'Unknown', {
    isUnknown: true,
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
