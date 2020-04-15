/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '../../object-enum';
import { StatusEnum } from '../../status-enum';

export class V2VVMImportStatus extends StatusEnum {
  static readonly IN_PROGRESS = new V2VVMImportStatus('V2VVMImportStatus_IN_PROGRESS', {
    isInProgress: true,
  });
  static readonly ERROR = new V2VVMImportStatus('V2VVMImportStatus_ERROR', { isError: true });
  static readonly COMPLETE = new V2VVMImportStatus('V2VVMImportStatus_COMPLETE', {
    isCompleted: true,
  });
  static readonly UNKNOWN = new V2VVMImportStatus('V2VVMImportStatus_UNKNOWN', { isUnknown: true });

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
