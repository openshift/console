/* eslint-disable lines-between-class-members,no-underscore-dangle */
import { getStringEnumValues } from '../../utils/types';
import { ObjectEnum } from '../object-enum';
import { StatusSimpleLabel } from '../status-constants';
import { StatusEnum, StatusMetadata } from '../status-enum';
import { StatusGroup } from '../status-group';
import { V2VVMImportStatus } from '../v2v-import/ovirt/v2v-vm-import-status';

export const VMStatusMigrationPhases = {
  Pending: {
    // t('kubevirt-plugin~Migration - Pending')
    labelKey: 'kubevirt-plugin~Migration - Pending',
  },
  Scheduling: {
    // t('kubevirt-plugin~Migration - Scheduling')
    labelKey: 'kubevirt-plugin~Migration - Scheduling',
  },
  PreparingTarget: {
    // t('kubevirt-plugin~Migration - Preparing Target')
    labelKey: 'kubevirt-plugin~Migration - Preparing Target',
  },
  Scheduled: {
    // t('kubevirt-plugin~Migration - Scheduled')
    labelKey: 'kubevirt-plugin~Migration - Scheduled',
  },
  TargetReady: {
    // t('kubevirt-plugin~Migration - Target Ready')
    labelKey: 'kubevirt-plugin~Migration - Target Ready',
  },
  Running: {
    // t('kubevirt-plugin~Migration - Running')
    labelKey: 'kubevirt-plugin~Migration - Running',
  },
};

export enum VMStatusSimpleLabel {
  Starting = 'Starting',
  Paused = 'Paused',
  Migrating = 'Migrating',
  Stopping = 'Stopping',
  Running = 'Running',
  Stopped = 'Stopped',
  Deleting = 'Deleting',
}

export enum VMPrintableStatusSimpleLabel {
  Stopped = 'Stopped',
  Migrating = 'Migrating',
  Provisioning = 'Provisioning',
  Starting = 'Starting',
  Running = 'Running',
  Paused = 'Paused',
  Stopping = 'Stopping',
  Terminating = 'Terminating',
  Unknown = 'Unknown',
}

export const VM_STATUS_SIMPLE_LABELS = [
  ...getStringEnumValues<VMStatusSimpleLabel>(VMStatusSimpleLabel),
  StatusSimpleLabel.Error,
  StatusSimpleLabel.Pending,
  StatusSimpleLabel.Importing,
  StatusSimpleLabel.Other,
];

const VM_STATUS_SIMPLE_LABELS_SET = new Set(VM_STATUS_SIMPLE_LABELS);

const isVMStatusSimpleLabel = (label: string): label is VMStatusSimpleLabel | StatusSimpleLabel =>
  VM_STATUS_SIMPLE_LABELS_SET.has(label as any);

type VMStatusMetadata = StatusMetadata & { isMigrating?: boolean };

export class VMStatus extends StatusEnum<VMStatusSimpleLabel | StatusSimpleLabel> {
  static readonly STOPPED = new VMStatus('VMStatus_STOPPED', VMStatusSimpleLabel.Stopped); // normal state
  static readonly RUNNING = new VMStatus('VMStatus_RUNNING', VMStatusSimpleLabel.Running); // normal state
  static readonly PAUSED = new VMStatus('VMStatus_PAUSED', VMStatusSimpleLabel.Paused); // normal state
  static readonly STARTING = new VMStatus('VMStatus_STARTING', VMStatusSimpleLabel.Starting, {
    isInProgress: true,
  });
  static readonly VMI_WAITING = new VMStatus('VMStatus_VMI_WAITING', StatusSimpleLabel.Pending, {
    isPending: true,
  });
  static readonly STOPPING = new VMStatus('VMStatus_STOPPING', VMStatusSimpleLabel.Stopping, {
    isInProgress: true,
  });
  static readonly DELETING = new VMStatus('VMStatus_DELETING', VMStatusSimpleLabel.Deleting, {
    isInProgress: true,
  });
  static readonly VM_ERROR = new VMStatus('VMStatus_VM_ERROR', 'VM error', {
    isError: true,
  });
  static readonly VMI_ERROR = new VMStatus('VMStatus_VMI_ERROR', 'VMI error', {
    isError: true,
  });
  static readonly LAUNCHER_POD_ERROR = new VMStatus(
    'VMStatus_LAUNCHER_POD_ERROR',
    'Launcher pod error',
    { isError: true },
  );
  static readonly CDI_IMPORT_ERROR = new VMStatus('VMStatus_CDI_IMPORT_ERROR', 'Import error', {
    isError: true,
    group: StatusGroup.CDI,
  });
  static readonly CDI_IMPORTING = new VMStatus(
    'VMStatus_CDI_IMPORTING',
    StatusSimpleLabel.Importing,
    {
      isImporting: true,
      group: StatusGroup.CDI,
    },
  );
  static readonly CDI_IMPORT_PENDING = new VMStatus(
    'VMStatus_CDI_IMPORT_PENDING',
    'Import pending',
    {
      isImporting: true,
      isPending: true,
      group: StatusGroup.CDI,
    },
  );
  static readonly MIGRATING = new VMStatus('VMStatus_MIGRATING', VMStatusSimpleLabel.Migrating, {
    isMigrating: true,
  });

  static readonly getMigrationStatus = (phase = 'Pending') =>
    new VMStatus(
      'VMStatus_MIGRATING',
      VMStatusSimpleLabel.Migrating,
      {
        isMigrating: true,
      },
      VMStatusMigrationPhases[phase].labelKey,
    );

  static readonly V2V_CONVERSION_ERROR = new VMStatus(
    'VMStatus_V2V_CONVERSION_ERROR',
    'Import error',
    { isError: true, group: StatusGroup.VMWARE },
  );
  static readonly V2V_CONVERSION_IN_PROGRESS = new VMStatus(
    'VMStatus_V2V_CONVERSION_IN_PROGRESS',
    StatusSimpleLabel.Importing,
    {
      isImporting: true,
      group: StatusGroup.VMWARE,
    },
  );
  static readonly V2V_CONVERSION_PENDING = new VMStatus(
    'VMStatus_V2V_CONVERSION_PENDING',
    'Import pending',
    {
      isImporting: true,
      isPending: true,
      group: StatusGroup.VMWARE,
    },
  );

  static readonly UNKNOWN = new VMStatus('UNKNOWN', 'Unknown', { isUnknown: true });

  private static newInstanceFromV2VVMImportStatus = (status: V2VVMImportStatus) => {
    return new VMStatus(`VMStatus_${status.getValue()}`, status.getLabel(), status.getMetadata());
  };

  static readonly V2V_VM_IMPORT_ERROR = VMStatus.newInstanceFromV2VVMImportStatus(
    V2VVMImportStatus.ERROR,
  );
  static readonly V2V_VM_IMPORT_PENDING = VMStatus.newInstanceFromV2VVMImportStatus(
    V2VVMImportStatus.PENDING,
  );
  static readonly V2V_VM_IMPORT_IN_PROGRESS = VMStatus.newInstanceFromV2VVMImportStatus(
    V2VVMImportStatus.IN_PROGRESS,
  );

  private readonly _isMigrating: boolean;

  protected constructor(
    value: string,
    label: string,
    { isMigrating, ...metadata }: VMStatusMetadata = {},
    labelKey?: string,
  ) {
    super(
      value,
      label,
      {
        ...metadata,
        isInProgress: isMigrating || metadata.isInProgress,
      },
      labelKey,
    );

    this._isMigrating = isMigrating || false;
  }

  isMigrating = () => this._isMigrating;

  getMetadata = (): VMStatusMetadata => ({
    ...super.getMetadata(),
    isMigrating: this._isMigrating,
  });

  protected resolveSimpleLabel(): StatusSimpleLabel | VMStatusSimpleLabel {
    return isVMStatusSimpleLabel(this.label) ? this.label : super.resolveSimpleLabel();
  }

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<VMStatus>(VMStatus),
  );

  private static readonly stringMapper = VMStatus.ALL.reduce(
    (accumulator, type: VMStatus) => ({
      ...accumulator,
      [type.value]: type,
    }),
    {},
  );

  static getAll = () => VMStatus.ALL;

  static fromString = (model: string): VMStatus => VMStatus.stringMapper[model];

  static fromV2VImportStatus = (v2VVMImportStatus: V2VVMImportStatus): VMStatus => {
    if (v2VVMImportStatus.isUnknown()) {
      return VMStatus.UNKNOWN;
    }
    return VMStatus.stringMapper[`VMStatus_${v2VVMImportStatus.getValue()}`];
  };
}

export const printableVmStatus = {
  Stopped: 'Stopped',
  Migrating: 'Migrating',
  Provisioning: 'Provisioning',
  Starting: 'Starting',
  Running: 'Running',
  Paused: 'Paused',
  Stopping: 'Stopping',
  Terminating: 'Terminating',
  Unknown: 'Unknown',
  CrashLoopBackOff: 'CrashLoopBackOff',
  FailedUnschedulable: 'FailedUnschedulable',
  ErrorUnschedulable: 'ErrorUnschedulable',
  ErrImagePull: 'ErrImagePull',
  ImagePullBackOff: 'ImagePullBackOff',
  ErrorPvcNotFound: 'ErrorPvcNotFound',
  ErrorDataVolumeNotFound: 'ErrorDataVolumeNotFound',
  DataVolumeError: 'DataVolumeError',
  WaitingForVolumeBinding: 'WaitingForVolumeBinding',
};

export const printableToVMStatus = {
  [printableVmStatus.Stopped]: VMStatus.STOPPED,
  [printableVmStatus.Migrating]: VMStatus.MIGRATING,
  [printableVmStatus.Provisioning]: VMStatus.STARTING,
  [printableVmStatus.Starting]: VMStatus.STARTING,
  [printableVmStatus.Running]: VMStatus.RUNNING,
  [printableVmStatus.Paused]: VMStatus.PAUSED,
  [printableVmStatus.Stopping]: VMStatus.STOPPING,
  [printableVmStatus.Terminating]: VMStatus.DELETING,
  [printableVmStatus.WaitingForVolumeBinding]: VMStatus.STARTING,
  [printableVmStatus.ErrImagePull]: VMStatus.VM_ERROR,
  [printableVmStatus.CrashLoopBackOff]: VMStatus.VM_ERROR,
  [printableVmStatus.FailedUnschedulable]: VMStatus.VM_ERROR,
  [printableVmStatus.ErrorUnschedulable]: VMStatus.VM_ERROR,
  [printableVmStatus.ImagePullBackOff]: VMStatus.VM_ERROR,
  [printableVmStatus.ErrorPvcNotFound]: VMStatus.CDI_IMPORT_ERROR,
  [printableVmStatus.ErrorDataVolumeNotFound]: VMStatus.CDI_IMPORT_ERROR,
  [printableVmStatus.DataVolumeError]: VMStatus.CDI_IMPORT_ERROR,
  [printableVmStatus.Unknown]: VMStatus.UNKNOWN,
};

export const printableStatusToLabel = {
  [printableVmStatus.Stopped]: VMStatusSimpleLabel.Stopped,
  [printableVmStatus.Migrating]: VMStatusSimpleLabel.Migrating,
  [printableVmStatus.Provisioning]: VMStatusSimpleLabel.Starting,
  [printableVmStatus.Starting]: VMStatusSimpleLabel.Starting,
  [printableVmStatus.Running]: VMStatusSimpleLabel.Running,
  [printableVmStatus.Paused]: VMStatusSimpleLabel.Paused,
  [printableVmStatus.Stopping]: VMStatusSimpleLabel.Stopping,
  [printableVmStatus.Terminating]: VMStatusSimpleLabel.Deleting,
  [printableVmStatus.WaitingForVolumeBinding]: VMStatusSimpleLabel.Starting,
  [printableVmStatus.ErrImagePull]: StatusSimpleLabel.Error,
  [printableVmStatus.CrashLoopBackOff]: StatusSimpleLabel.Error,
  [printableVmStatus.FailedUnschedulable]: StatusSimpleLabel.Error,
  [printableVmStatus.ErrorUnschedulable]: StatusSimpleLabel.Error,
  [printableVmStatus.ImagePullBackOff]: StatusSimpleLabel.Error,
  [printableVmStatus.ErrorPvcNotFound]: StatusSimpleLabel.Error,
  [printableVmStatus.ErrorDataVolumeNotFound]: StatusSimpleLabel.Error,
  [printableVmStatus.DataVolumeError]: StatusSimpleLabel.Error,
  [printableVmStatus.Unknown]: StatusSimpleLabel.Other,
};

export const getVmStatusFromPrintable = (printableStatus: string): VMStatus =>
  printableToVMStatus?.[printableStatus] || VMStatus.UNKNOWN;

export const getVmStatusLabelFromPrintable = (printableStatus: string) =>
  printableStatusToLabel?.[printableStatus] || StatusSimpleLabel.Other;
