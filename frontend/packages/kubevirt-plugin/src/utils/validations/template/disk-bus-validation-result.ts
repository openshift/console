import { joinGrammaticallyListOfItems } from '../..';
import { DiskBus } from '../../../constants/vm/storage/disk-bus';
import { ValidationObject, ValidationErrorType, asValidationObject } from '../../../selectors';

export class DiskBusValidationResult {
  allowedBuses: Set<DiskBus>;

  type: ValidationErrorType;

  isValid: boolean;

  constructor({ allowedBuses, type, isValid }) {
    this.allowedBuses = allowedBuses;
    this.type = type;
    this.isValid = isValid;
  }

  public getErrorMsg = () => {
    if (this.isValid) {
      return null;
    }
    const isWarn = this.type === ValidationErrorType.Warn;
    const adj = isWarn ? 'Recommended' : 'Valid';
    const adj2 = isWarn ? 'Not recommended' : 'Invalid';
    if (this.allowedBuses.size === 0) {
      return `There are no ${adj.toLowerCase()} bus types`;
    }
    if (this.allowedBuses.size === 1) {
      return `${adj2} bus type. ${adj} type is ${[...this.allowedBuses][0]}`;
    }
    return `${adj2} bus type. ${adj} types are: ${joinGrammaticallyListOfItems(
      [...this.allowedBuses].map((b) => b.toString()),
    )}`;
  };

  public asValidationObject = (): ValidationObject => {
    return !this.isValid ? asValidationObject(this.getErrorMsg(), this.type) : null;
  };
}
