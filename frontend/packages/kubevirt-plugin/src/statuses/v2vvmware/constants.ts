import { ObjectEnum } from '../../constants';

// phases constants conform v2vvmware_controller.go
export class V2VVMwareStatus extends ObjectEnum<string> {
  static readonly CONNECTING = new V2VVMwareStatus('CONNECTING', 'Connecting');

  static readonly CONNECTION_TO_VCENTER_FAILED = new V2VVMwareStatus(
    'CONNECTION_TO_VCENTER_FAILED',
    'Failed',
  );

  static readonly LOADING_VMS_LIST = new V2VVMwareStatus('LOADING_VMS_LIST', 'LoadingVmsList');

  static readonly LOADING_VMS_LIST_FAILED = new V2VVMwareStatus(
    'LOADING_VMS_LIST_FAILED',
    'LoadingVmsListFailed',
  );

  static readonly LOADING_VM_DETAIL = new V2VVMwareStatus('LOADING_VM_DETAIL', 'LoadingVmDetail');

  static readonly LOADING_VM_DETAIL_FAILED = new V2VVMwareStatus(
    'LOADING_VM_DETAIL_FAILED',
    'LoadingVmDetailFailed',
  );

  static readonly CONNECTION_SUCCESSFUL = new V2VVMwareStatus(
    'CONNECTION_SUCCESSFUL',
    'ConnectionVerified',
  );

  static readonly CONNECTION_FAILED = new V2VVMwareStatus('CONNECTION_FAILED');

  static readonly UNKNOWN = new V2VVMwareStatus('UNKNOWN');

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<V2VVMwareStatus>(V2VVMwareStatus),
  );

  private static readonly stringMapper = V2VVMwareStatus.ALL.reduce(
    (accumulator, status: V2VVMwareStatus) => ({
      ...accumulator,
      [status.value]: status,
    }),
    {},
  );

  private static readonly phaseMapper = V2VVMwareStatus.ALL.reduce(
    (accumulator, status: V2VVMwareStatus) => {
      if (status.phase) {
        return {
          ...accumulator,
          [status.phase]: status,
        };
      }
      return accumulator;
    },
    {},
  );

  static getAll = () => V2VVMwareStatus.ALL;

  static fromSerialized = (status: { value: string }): V2VVMwareStatus =>
    V2VVMwareStatus.fromString(status && status.value);

  static fromString = (model: string): V2VVMwareStatus => V2VVMwareStatus.stringMapper[model];

  static fromPhase = (phase: string): V2VVMwareStatus => V2VVMwareStatus.phaseMapper[phase];

  private readonly phase: string;

  private constructor(value: string, phase?: string) {
    super(value);
    this.phase = phase;
  }

  toString = () => {
    return this.phase;
  };
}

export const V2V_WMWARE_STATUS_ALL_OK = new Set([V2VVMwareStatus.CONNECTION_SUCCESSFUL]);
