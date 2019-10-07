import { VMWizardTab } from '../types';

export const CREATE_VM = 'Create Virtual Machine';
export const CREATE_VM_TEMPLATE = `${CREATE_VM} Template`;
export const REVIEW_AND_CREATE = 'Review and create';
export const NO_TEMPLATE = 'None';
export const NO_TEMPLATE_AVAILABLE = 'No template available';

export const getCreateVMLikeEntityLabel = (isTemplate: boolean) =>
  isTemplate ? CREATE_VM_TEMPLATE : CREATE_VM;

export const TabTitleResolver = {
  [VMWizardTab.VM_SETTINGS]: 'General',
  [VMWizardTab.NETWORKS]: 'Networking',
  [VMWizardTab.STORAGE]: 'Storage',
  [VMWizardTab.REVIEW]: 'Review',
  [VMWizardTab.RESULT]: 'Result',
};
