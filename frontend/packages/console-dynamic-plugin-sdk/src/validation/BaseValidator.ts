import { ValidationResult } from './ValidationResult';

export abstract class BaseValidator {
  readonly result: ValidationResult;

  constructor(description: string) {
    this.result = new ValidationResult(description);
  }

  abstract validate(...args: any[]): ValidationResult;
}
