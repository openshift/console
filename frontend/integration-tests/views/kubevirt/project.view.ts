import { $$ } from 'protractor';

export const itemVirtualMachine = $$('.project-overview__item--VirtualMachine');
export const virtualMachineLink = (rowNumber) => itemVirtualMachine.get(rowNumber).$('a.co-resource-item__resource-name');
export const vmStatusLink = (rowNumber) => itemVirtualMachine.get(rowNumber).$('.project-overview__detail--status').$('a');
