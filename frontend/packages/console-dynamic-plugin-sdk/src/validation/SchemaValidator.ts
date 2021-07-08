import * as Ajv from 'ajv';
import { ValidationAssertions } from './ValidationAssertions';
import { ValidationResult } from './ValidationResult';

export class SchemaValidator {
  readonly result: ValidationResult;

  readonly assert: ValidationAssertions;

  constructor(description: string, private readonly ajv = new Ajv({ allErrors: true })) {
    this.result = new ValidationResult(description);
    this.assert = new ValidationAssertions(this.result);
  }

  validate(schema: object, data: any, dataVar: string = 'obj') {
    if (!this.ajv.validate(schema, data)) {
      this.ajv.errors.forEach((error) => {
        // This format is consistent with ajv.errorsText() implementation
        this.result.addError(`${dataVar}${error.dataPath} ${error.message}`);
      });
    }

    return this.result;
  }
}
