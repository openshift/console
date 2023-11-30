import chalk from 'chalk';
import * as semver from 'semver';

class ValidationAssertions {
  constructor(private readonly result: ValidationResult) {}

  // https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-subdomain-names
  validDNSSubdomainName(obj: any, objPath: string) {
    if (typeof obj === 'string') {
      this.result.assertThat(
        obj.length <= 253,
        `${objPath} must contain no more than 253 characters`,
      );
      this.result.assertThat(
        /^[a-z0-9-.]*$/.test(obj),
        `${objPath} must contain only lowercase alphanumeric characters, '-' or '.'`,
      );
      this.result.assertThat(
        /^[a-z0-9]+/.test(obj) && /[a-z0-9]+$/.test(obj),
        `${objPath} must start and end with an alphanumeric character`,
      );
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

export class ValidationResult {
  private readonly errors: string[] = [];

  readonly assertions = new ValidationAssertions(this);

  constructor(private readonly description: string) {}

  assertThat(condition: boolean, message: string) {
    if (!condition) {
      this.addError(message);
    }
  }

  addError(message: string) {
    this.errors.push(message);
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  getErrors() {
    return [...this.errors];
  }

  formatErrors() {
    const prefix = `${chalk.bold(this.description)} (${this.errors.length} errors)\n`;
    const errorLines = this.errors.map((e) => `    ${chalk.red(e)}`);
    return prefix + errorLines.join('\n');
  }

  report(throwOnErrors: boolean = true) {
    if (this.hasErrors()) {
      // eslint-disable-next-line no-console
      console.error(this.formatErrors());

      if (throwOnErrors) {
        throw new Error('Validation failed');
      }
    }
  }
}
