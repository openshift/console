import chalk from 'chalk';

export class ValidationResult {
  private readonly errors: string[] = [];

  // eslint-disable-next-line no-empty-function
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

  formatErrors() {
    const prefix = `${chalk.bold(this.description)} (${this.errors.length} errors)\n\n`;
    const errorLines = this.errors.map((e) => `    ${chalk.red(e)}`);
    return prefix + errorLines.join('\n');
  }

  report(throwOnErrors: boolean = true, console: Console = global.console) {
    if (this.hasErrors()) {
      console.error(this.formatErrors());
      if (throwOnErrors) {
        throw new Error('Validation failed');
      }
    }
  }
}
