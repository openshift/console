/* eslint-disable lines-between-class-members,no-underscore-dangle */
import { ObjectEnum } from './object-enum';

export interface StatusMetadata {
  isError?: boolean;
  isCompleted?: boolean;
  isPending?: boolean;
  isInProgress?: boolean;
  isUnknown?: boolean;
}

export abstract class StatusEnum extends ObjectEnum<string> {
  protected readonly _isError: boolean;
  protected readonly _isCompleted: boolean;
  protected readonly _isPending: boolean;
  protected readonly _isInProgress: boolean;
  protected readonly _isUnknown: boolean;

  protected constructor(
    value: string,
    { isError, isCompleted, isPending, isInProgress, isUnknown }: StatusMetadata = {},
  ) {
    super(value);
    this._isError = isError || false;
    this._isCompleted = isCompleted || false;
    this._isPending = isPending || false;
    this._isInProgress = this._isPending || isInProgress || false; // pending means expected progress

    const isKnown = isError || isCompleted || isPending || isInProgress;

    this._isUnknown = isKnown ? false : isUnknown || false; // unknown status can't have other metadata
  }

  isError = () => this._isError;

  isCompleted = () => this._isCompleted;

  isPending = () => this._isPending;

  isInProgress = () => this._isInProgress;

  isUnknown = () => this._isUnknown;

  getMetadata = (): StatusMetadata =>
    ({
      isError: this._isError,
      isCompleted: this._isCompleted,
      isPending: this._isPending,
      isInProgress: this._isInProgress,
      isUnknown: this._isUnknown,
    } as any);
}
