import { ObjectEnum } from '../../constants';

export class VMImportSucceededConditionReason extends ObjectEnum<string> {
  static readonly VirtualMachineReady = new VMImportSucceededConditionReason('VirtualMachineReady');

  static readonly VirtualMachineRunning = new VMImportSucceededConditionReason(
    'VirtualMachineRunning',
  );

  static readonly ValidationFailed = new VMImportSucceededConditionReason('ValidationFailed', true);

  static readonly UpdatingSourceVMFailed = new VMImportSucceededConditionReason(
    'UpdatingSourceVMFailed',
    true,
  );

  static readonly VMCreationFailed = new VMImportSucceededConditionReason('VMCreationFailed', true);

  static readonly DataVolumeCreationFailed = new VMImportSucceededConditionReason(
    'DataVolumeCreationFailed',
    true,
  );

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<VMImportSucceededConditionReason>(
      VMImportSucceededConditionReason,
    ),
  );

  private static readonly stringMapper = VMImportSucceededConditionReason.ALL.reduce(
    (accumulator, status: VMImportSucceededConditionReason) => ({
      ...accumulator,
      [status.value]: status,
    }),
    {},
  );

  static getAll = () => VMImportSucceededConditionReason.ALL;

  static fromString = (model: string): VMImportSucceededConditionReason =>
    VMImportSucceededConditionReason.stringMapper[model];

  private readonly failed: boolean;

  private constructor(value: string, failed: boolean = false) {
    super(value);
    this.failed = failed;
  }

  hasfailed = (): boolean => this.failed;
}
