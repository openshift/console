import { ObjectEnum } from '@console/shared/src/constants/object-enum';

// phases constants conform v2vvmware_controller.go
export class V2VProviderStatus extends ObjectEnum<string> {
  static readonly CONNECTING = new V2VProviderStatus('CONNECTING', 'Connecting');

  static readonly CONNECTION_TO_API_FAILED = new V2VProviderStatus(
    'CONNECTION_TO_API_FAILED',
    'Failed',
  );

  static readonly LOADING_VMS_LIST = new V2VProviderStatus('LOADING_VMS_LIST', 'LoadingVmsList');

  static readonly LOADING_VMS_LIST_FAILED = new V2VProviderStatus(
    'LOADING_VMS_LIST_FAILED',
    'LoadingVmsListFailed',
  );

  static readonly LOADING_VM_DETAIL = new V2VProviderStatus('LOADING_VM_DETAIL', 'LoadingVmDetail');

  static readonly LOADING_VM_DETAIL_FAILED = new V2VProviderStatus(
    'LOADING_VM_DETAIL_FAILED',
    'LoadingVmDetailFailed',
  );

  static readonly CONNECTION_SUCCESSFUL = new V2VProviderStatus(
    'CONNECTION_SUCCESSFUL',
    'ConnectionVerified',
  );

  static readonly CONNECTION_FAILED = new V2VProviderStatus('CONNECTION_FAILED');

  static readonly UNKNOWN = new V2VProviderStatus('UNKNOWN');

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<V2VProviderStatus>(V2VProviderStatus),
  );

  private static readonly stringMapper = V2VProviderStatus.ALL.reduce(
    (accumulator, status: V2VProviderStatus) => ({
      ...accumulator,
      [status.value]: status,
    }),
    {},
  );

  private static readonly phaseMapper = V2VProviderStatus.ALL.reduce(
    (accumulator, status: V2VProviderStatus) => {
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

  static getAll = () => V2VProviderStatus.ALL;

  static fromString = (model: string): V2VProviderStatus => V2VProviderStatus.stringMapper[model];

  static fromPhase = (phase: string): V2VProviderStatus => V2VProviderStatus.phaseMapper[phase];

  private readonly phase: string;

  private constructor(value: string, phase?: string) {
    super(value);
    this.phase = phase;
  }

  toString() {
    return this.phase;
  }
}

export const V2V_PROVIDER_STATUS_ALL_OK = new Set([V2VProviderStatus.CONNECTION_SUCCESSFUL]);
