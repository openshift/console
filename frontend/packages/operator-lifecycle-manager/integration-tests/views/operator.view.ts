import { $ } from 'protractor';
import { Descriptor } from '../../src/components/descriptors/types';

export const operandLink = (name: string) => $(`[data-test-operand-link="${name}"]`);
export const descriptorLabel = ({ displayName }: Descriptor) =>
  $(`[data-test-descriptor-label="${displayName}"]`);
