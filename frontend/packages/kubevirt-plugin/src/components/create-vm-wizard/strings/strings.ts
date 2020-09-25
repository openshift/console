import { VMWizardTab } from '../types';

export const CREATE_VM = 'Create Virtual Machine';
export const CREATE_VM_TEMPLATE = `${CREATE_VM} Template`;
export const IMPORT = 'Import';
export const IMPORT_VM = 'Import Virtual Machine';
export const REVIEW_AND_CONFIRM = 'Review and confirm';
export const NO_TEMPLATE = 'None';
export const SELECT_TEMPLATE = '--- Select Template ---';
export const NO_TEMPLATE_AVAILABLE = 'No template available';
export const NO_OPENSHIFT_TEMPLATES = 'Non-Openshift Cluster detected - Templates are Unavailable';
export const WIZARD_CLOSE_PROMPT =
  "Are you sure you want to navigate away from this form? Any data you've added will be lost.";

export const getCreateVMLikeEntityLabel = (isTemplate: boolean, isProviderImport: boolean) =>
  isProviderImport ? IMPORT : isTemplate ? CREATE_VM_TEMPLATE : CREATE_VM;

export const TabTitleResolver = {
  [VMWizardTab.IMPORT_PROVIDERS]: 'Connect to Provider',
  [VMWizardTab.VM_SETTINGS]: 'General',
  [VMWizardTab.NETWORKING]: 'Networking',
  [VMWizardTab.STORAGE]: 'Storage',
  [VMWizardTab.ADVANCED_CLOUD_INIT]: 'Cloud-init',
  [VMWizardTab.REVIEW]: 'Review',
  [VMWizardTab.RESULT]: 'Result',
};

export const BASE_IMAGE_AND_PVC_SHORT = '(Source available)';
export const BASE_IMAGE_AND_PVC_UPLOADING_SHORT = '(Source uploading)';
export const NO_BASE_IMAGE_SHORT = '';
export const NO_BASE_IMAGE_AND_NO_PVC_SHORT = '';
export const BASE_IMAGE_AND_PVC_MESSAGE = '';
export const BASE_IMAGE_UPLOADING_MESSAGE =
  'The upload process for this Operating system must complete before it can be cloned';
export const NO_BASE_IMAGE_AND_NO_PVC_MESSAGE =
  'The Operating System Template is missing disk image definitions, a custom boot source must be defined manually';
