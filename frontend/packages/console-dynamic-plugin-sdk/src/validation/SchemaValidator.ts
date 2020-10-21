import * as Ajv from 'ajv';
import { ValidationResult } from './ValidationResult';

export class SchemaValidator {
  private readonly ajv = new Ajv({ allErrors: true });

  public readonly result: ValidationResult;

  constructor(description: string) {
    this.result = new ValidationResult(description);
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
