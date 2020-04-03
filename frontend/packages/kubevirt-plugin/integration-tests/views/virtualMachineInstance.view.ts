import { $ } from 'protractor';
import { vmDetailItemId } from './virtualMachine.view';

export const vmiDetailFlavor = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'flavor'));
