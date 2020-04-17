/* eslint-disable lines-between-class-members,no-underscore-dangle */
import { ObjectEnum } from './object-enum';
import { StatusSimpleLabel } from './status-constants';
import { StatusGroup } from './status-group';

export interface StatusMetadata {
  isError?: boolean;
  isCompleted?: boolean;
  isPending?: boolean;
  isImporting?: boolean;
  isInProgress?: boolean;
  isUnknown?: boolean;
  group?: StatusGroup;
}

export abstract class StatusEnum<SIMPLE_LABEL = StatusSimpleLabel> extends ObjectEnum<string> {
  protected readonly _isError: boolean;
  protected readonly _isCompleted: boolean;
  protected readonly _isPending: boolean;
  protected readonly _isImporting: boolean;
  protected readonly _isInProgress: boolean;
  protected readonly _isUnknown: boolean;

  protected readonly group: StatusGroup;
  protected readonly label: string;
  protected readonly simpleLabel: SIMPLE_LABEL | StatusSimpleLabel; // cache resolveSimpleLabel call

  protected constructor(
    value: string,
    label: string,
    {
      isError,
      isCompleted,
      isPending,
      isImporting,
      isInProgress,
      isUnknown,
      group,
    }: StatusMetadata = {},
  ) {
    super(value);
    if (label == null) {
      throw new Error('StatusEnum: requires label');
    }

    this._isError = isError || false;
    this._isCompleted = isCompleted || false;
    this._isPending = isPending || false;
    this._isImporting = isImporting || false;
    this._isInProgress = this._isPending || this._isImporting || isInProgress || false; // pending means expected progress

    const isKnown = isError || isCompleted || isPending || isImporting || isInProgress;

    if (isUnknown && isKnown) {
      throw new Error('StatusEnum: isUnknown flag should not include other metadata');
    }

    this._isUnknown = isUnknown;

    this.group = group;
    this.label = label;
    this.simpleLabel = this.resolveSimpleLabel();
  }

  isError = () => this._isError;

  isCompleted = () => this._isCompleted;

  isPending = () => this._isPending;

  isImporting = () => this._isImporting;

  isInProgress = () => this._isInProgress;

  isUnknown = () => this._isUnknown;

  getMetadata = (): StatusMetadata =>
    ({
      isError: this._isError,
      isCompleted: this._isCompleted,
      isPending: this._isPending,
      isImporting: this._isImporting,
      isInProgress: this._isInProgress,
      isUnknown: this._isUnknown,
      group: this.group,
    } as any);

  getLabel = () => this.label;

  getGroup = () => this.group;

  getSimpleLabel = () => this.simpleLabel;

  toString() {
    const result = this.label || super.toString();
    return this.group && !this._isUnknown ? `${result} (${this.group.toString()})` : result;
  }

  toSimpleSortString = () => {
    return `${this.simpleLabel}${this.simpleLabel === this.toString() ? '' : this.toString()}`;
  };

  toVerboseString = () => {
    const result = this.label || super.toString();
    return this.group && !this._isUnknown ? `${result} (${this.group.getVerboseName()})` : result;
  };

  protected resolveSimpleLabel(): SIMPLE_LABEL | StatusSimpleLabel {
    if (this._isError) {
      return StatusSimpleLabel.Error;
    }
    if (this._isCompleted) {
      return StatusSimpleLabel.Completed;
    }
    if (this._isPending) {
      return StatusSimpleLabel.Pending;
    }
    if (this._isImporting) {
      return StatusSimpleLabel.Importing;
    }
    if (this._isInProgress) {
      return StatusSimpleLabel.InProgress;
    }
    return StatusSimpleLabel.Other;
  }
}
