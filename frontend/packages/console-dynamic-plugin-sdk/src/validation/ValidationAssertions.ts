import * as semver from 'semver';
import { ValidationResult } from './ValidationResult';

export class ValidationAssertions {
  // eslint-disable-next-line no-empty-function
  constructor(private readonly result: ValidationResult) {}

  nonEmptyString(obj: any, objPath: string) {
    if (typeof obj === 'string') {
      this.result.assertThat(obj.trim().length > 0, `${objPath} must not be empty`);
    }
  }

  validSemverString(obj: any, objPath: string) {
    if (typeof obj === 'string') {
      this.result.assertThat(!!semver.valid(obj), `${objPath} must be semver compliant`);
    }
  }

  validSemverRangeString(obj: any, objPath: string) {
    if (typeof obj === 'string') {
      this.result.assertThat(!!semver.validRange(obj), `${objPath} semver range is not valid`);
    }
  }
}
