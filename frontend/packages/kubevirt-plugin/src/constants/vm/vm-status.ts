/* eslint-disable lines-between-class-members,no-underscore-dangle */
import { ObjectEnum } from '../object-enum';
import { V2VVMImportStatus } from '../v2v-import/ovirt/v2v-vm-import-status';
import { StatusEnum, StatusMetadata } from '../status-enum';
import { getStringEnumValues } from '../../utils/types';

export enum VMStatusSimpleLabel {
  Pending = 'Pending',
  Importing = 'Importing',
  Error = 'Error',
  Starting = 'Starting',
  Paused = 'Paused',
  Migrating = 'Migrating',
  Stopping = 'Stopping',
  Running = 'Running',
  Off = 'Off',
  Other = 'Other',
}

const SIMPLE_LABELS = new Set(getStringEnumValues<VMStatusSimpleLabel>(VMStatusSimpleLabel));

type VMStatusMetadata = StatusMetadata & { isImporting?: boolean; isMigrating?: boolean };

const resolveSimpleLabel = (
  label: string,
  { isError, isPending, isImporting }: VMStatusMetadata,
) => {
  if (SIMPLE_LABELS.has(label as any)) {
    return label as VMStatusSimpleLabel;
  }
  if (isError) {
    return VMStatusSimpleLabel.Error;
  }
  if (isPending) {
    return VMStatusSimpleLabel.Pending;
  }
  if (isImporting) {
    return VMStatusSimpleLabel.Importing;
  }
  return VMStatusSimpleLabel.Other;
};

export class VMStatus extends StatusEnum {
  static readonly OFF = new VMStatus('OFF', VMStatusSimpleLabel.Off); // normal state
  static readonly RUNNING = new VMStatus('RUNNING', VMStatusSimpleLabel.Running); // normal state
  static readonly PAUSED = new VMStatus('PAUSED', VMStatusSimpleLabel.Paused); // normal state
  static readonly STARTING = new VMStatus('STARTING', VMStatusSimpleLabel.Starting, {
    isInProgress: true,
  });
  static readonly VMI_WAITING = new VMStatus('VMI_WAITING', VMStatusSimpleLabel.Pending, {
    isPending: true,
  });
  static readonly STOPPING = new VMStatus('STOPPING', VMStatusSimpleLabel.Stopping, {
    isInProgress: true,
  });
  static readonly VM_ERROR = new VMStatus('VM_ERROR', 'VM error', { isError: true });
  static readonly POD_ERROR = new VMStatus('POD_ERROR', 'Pod error', { isError: true });
  static readonly CDI_IMPORT_ERROR = new VMStatus('CDI_IMPORT_ERROR', 'Import error (CDI)', {
    isError: true,
  });
  static readonly CDI_IMPORTING = new VMStatus('CDI_IMPORTING', 'Importing (CDI)', {
    isImporting: true,
  });
  static readonly CDI_IMPORT_PENDING = new VMStatus('CDI_IMPORT_PENDING', 'Import pending (CDI)', {
    isImporting: true,
    isPending: true,
  });
  static readonly MIGRATING = new VMStatus('MIGRATING', VMStatusSimpleLabel.Migrating, {
    isMigrating: true,
  });
  static readonly V2V_CONVERSION_ERROR = new VMStatus(
    'V2V_CONVERSION_ERROR',
    'Import error (VMware)',
    { isError: true },
  );
  static readonly V2V_CONVERSION_IN_PROGRESS = new VMStatus(
    'V2V_CONVERSION_IN_PROGRESS',
    'Importing (VMware)',
    {
      isImporting: true,
    },
  );
  static readonly V2V_CONVERSION_PENDING = new VMStatus(
    'V2V_CONVERSION_PENDING',
    'Import pending (VMware)',
    {
      isImporting: true,
      isPending: true,
    },
  );
  static readonly V2V_VM_IMPORT_ERROR = new VMStatus(
    'V2V_VM_IMPORT_ERROR',
    'Import error (Red Hat Virtualization)',
    V2VVMImportStatus.ERROR.getMetadata(),
    {
      v2vVMImportStatus: V2VVMImportStatus.ERROR,
    },
  );
  static readonly V2V_VM_IMPORT_IN_PROGRESS = new VMStatus(
    'V2V_VM_IMPORT_IN_PROGRESS',
    'Importing (Red Hat Virtualization)',
    {
      ...V2VVMImportStatus.IN_PROGRESS.getMetadata(),
      isImporting: true,
    },
    {
      v2vVMImportStatus: V2VVMImportStatus.IN_PROGRESS,
    },
  );
  static readonly UNKNOWN = new VMStatus('UNKNOWN', 'Unknown', { isUnknown: true });

  private readonly _isImporting: boolean;
  private readonly _isMigrating: boolean;

  private readonly v2vVMImportStatus: V2VVMImportStatus;

  private readonly label: string;
  private readonly simpleLabel: VMStatusSimpleLabel;

  protected constructor(
    value: string,
    label: string,
    { isImporting, isMigrating, ...metadata }: VMStatusMetadata = {},
    { v2vVMImportStatus }: { v2vVMImportStatus?: V2VVMImportStatus } = {},
  ) {
    super(value, {
      ...metadata,
      isInProgress: isImporting || isMigrating || metadata.isInProgress,
    });
    if (label == null) {
      throw new Error('VMStatus: requires label or simple label');
    }

    this._isImporting = isImporting || false;
    this._isMigrating = isMigrating || false;

    this.v2vVMImportStatus = v2vVMImportStatus;

    this.label = label;
    this.simpleLabel = resolveSimpleLabel(label, {
      isError: this._isError,
      isCompleted: this._isCompleted,
      isPending: this._isPending,
      isInProgress: this._isInProgress,
      isImporting: this._isImporting,
      isMigrating: this._isMigrating,
    });
  }

  isImporting = () => this._isImporting;
  isMigrating = () => this._isMigrating;

  getSimpleLabel = () => this.simpleLabel;

  toSimpleSortString = () => {
    return `${this.simpleLabel}${this.simpleLabel === this.label ? '' : this.label}`;
  };

  getMetadata = (): VMStatusMetadata => ({
    ...super.getMetadata(),
    isImporting: this._isImporting,
    isMigrating: this._isMigrating,
  });

  toString() {
    return this.label || super.toString();
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

  private static readonly v2vImportStatusMapper = VMStatus.ALL.reduce(
    (accumulator, type: VMStatus) => {
      if (type.v2vVMImportStatus) {
        accumulator[type.v2vVMImportStatus.getValue()] = type;
      }
      return accumulator;
    },
    {},
  );

  static getAll = () => VMStatus.ALL;

  static fromString = (model: string): VMStatus => VMStatus.stringMapper[model];

  static fromV2VImportStatus = (v2VVMImportStatus: V2VVMImportStatus): VMStatus =>
    VMStatus.v2vImportStatusMapper[v2VVMImportStatus.getValue()];
}
