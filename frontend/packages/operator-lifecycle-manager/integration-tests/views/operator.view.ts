import { $ } from 'protractor';
import { Descriptor } from '../../src/components/descriptors/types';

export const rowForOperator = (displayName: string) =>
  $(`[data-test-operator-row="${displayName}"]`);
export const operatorNameLink = (displayName: string) =>
  $(`[data-test-operator-row="${displayName}"]`).$('.co-clusterserviceversion-logo__name');
export const operandLink = (name: string) => $(`[data-test-operand-link="${name}"]`);
export const operandKind = (kind: string) => $(`[data-test-operand-kind="${kind}"]`);
export const descriptorLabel = ({ displayName }: Descriptor) =>
  $(`[data-test-selector="details-item-label__${displayName}"]`);
