/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '../../object-enum';

export class VMImportType extends ObjectEnum<string> {
  static readonly OVIRT = new VMImportType('ovirt');

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<VMImportType>(VMImportType),
  );

  private static readonly stringMapper = VMImportType.ALL.reduce(
    (accumulator, type: VMImportType) => ({
      ...accumulator,
      [type.value]: type,
    }),
    {},
  );

  static getAll = () => VMImportType.ALL;

  static fromString = (model: string): VMImportType => VMImportType.stringMapper[model];
}
