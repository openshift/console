import { $ } from 'protractor';

export const rowForOperator = (displayName: string) =>
  $(`[data-test-operator-row="${displayName}"]`);
