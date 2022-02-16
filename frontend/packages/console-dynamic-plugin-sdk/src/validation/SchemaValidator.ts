import * as Ajv from 'ajv';
import { ValidationAssertions } from './ValidationAssertions';
import { ValidationResult } from './ValidationResult';

export class SchemaValidator {
  readonly result: ValidationResult;

  readonly assert: ValidationAssertions;

  knownExtensions: string[];

  constructor(description: string, private readonly ajv = new Ajv({ allErrors: true })) {
    this.result = new ValidationResult(description);
    this.assert = new ValidationAssertions(this.result);
  }

  validate(schema: any, data: any, dataVar: string = 'obj') {
    if (!this.knownExtensions) {
      this.knownExtensions = Object.entries(schema.definitions).reduce((acc, [, v]: any) => {
        return v?.properties?.type?.const ? [v.properties.type.const, ...acc] : acc;
      }, []);
    }
    const refinedData = data.filter((datum) => this.knownExtensions.includes(datum.type));
    if (!this.ajv.validate(schema, refinedData)) {
      this.ajv.errors.forEach((error) => {
        // This format is consistent with ajv.errorsText() implementation
        this.result.addError(`${dataVar}${error.dataPath} ${error.message}`);
      });
    }

    return this.result;
  }
}
