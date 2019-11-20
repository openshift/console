import { VMWizardTab } from '../types';

export const CREATE_VM = 'Create Virtual Machine';
export const CREATE_VM_TEMPLATE = `${CREATE_VM} Template`;
export const IMPORT_VM = 'Import Virtual Machine';
export const REVIEW_AND_CREATE = 'Review and create';
export const NO_TEMPLATE = 'None';
export const SELECT_TEMPLATE = '--- Select Template ---';
export const NO_TEMPLATE_AVAILABLE = 'No template available';
export const WIZARD_CLOSE_PROMPT =
  "Are you sure you want to navigate away from this form? Any data you've added will be lost.";

export const getCreateVMLikeEntityLabel = (isTemplate: boolean) =>
  isTemplate ? CREATE_VM_TEMPLATE : CREATE_VM;

export const TabTitleResolver = {
  [VMWizardTab.VM_SETTINGS]: 'General',
  [VMWizardTab.NETWORKING]: 'Networking',
  [VMWizardTab.STORAGE]: 'Storage',
  [VMWizardTab.ADVANCED_CLOUD_INIT]: 'Cloud-init',
  [VMWizardTab.REVIEW]: 'Review',
  [VMWizardTab.RESULT]: 'Result',
};
