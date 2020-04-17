/* eslint-disable lines-between-class-members,no-underscore-dangle */
import { ObjectEnum } from './object-enum';
import { StatusSimpleLabel } from './status-simple-label';

export interface StatusMetadata {
  isError?: boolean;
  isCompleted?: boolean;
  isPending?: boolean;
  isImporting?: boolean;
  isInProgress?: boolean;
  isUnknown?: boolean;
}

export abstract class StatusEnum<SIMPLE_LABEL = StatusSimpleLabel> extends ObjectEnum<string> {
  protected readonly _isError: boolean;
  protected readonly _isCompleted: boolean;
  protected readonly _isPending: boolean;
  protected readonly _isImporting: boolean;
  protected readonly _isInProgress: boolean;
  protected readonly _isUnknown: boolean;

  protected readonly label: string;
  protected readonly simpleLabel: SIMPLE_LABEL | StatusSimpleLabel; // cache resolveSimpleLabel call

  protected constructor(
    value: string,
    label: string,
    { isError, isCompleted, isPending, isImporting, isInProgress, isUnknown }: StatusMetadata = {},
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

    this._isUnknown = isKnown ? false : isUnknown || false; // unknown status can't have other metadata

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
    } as any);

  getLabel = () => this.label;

  getSimpleLabel = () => this.simpleLabel;

  toString() {
    return this.label || super.toString();
  }

  toSimpleSortString = () => {
    return `${this.simpleLabel}${this.simpleLabel === this.label ? '' : this.label}`;
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
