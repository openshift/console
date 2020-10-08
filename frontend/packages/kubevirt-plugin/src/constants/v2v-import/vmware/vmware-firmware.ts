/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '@console/shared/src/constants/object-enum';

export class VMwareFirmware extends ObjectEnum<string> {
  static readonly BIOS = new VMwareFirmware('bios', true);
  static readonly EFI = new VMwareFirmware('efi');

  private readonly supported: boolean;

  protected constructor(value: string, supported: boolean = false) {
    super(value);
    this.supported = supported;
  }

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<VMwareFirmware>(VMwareFirmware),
  );

  private static readonly stringMapper = VMwareFirmware.ALL.reduce(
    (accumulator, type: VMwareFirmware) => ({
      ...accumulator,
      [type.value]: type,
    }),
    {},
  );

  static getAll = () => VMwareFirmware.ALL;

  static fromString = (model: string): VMwareFirmware => VMwareFirmware.stringMapper[model];

  isSupported = () => {
    return this.supported;
  };
}
