import { iGetIn } from '../../../../utils/immutable';
import { VMWizardTab } from '../../types';

export const isStepValid = (stepData, stepId: VMWizardTab) =>
  !!iGetIn(stepData, [stepId, 'isValid']);
export const isStepLocked = (stepData, stepId: VMWizardTab) =>
  !!iGetIn(stepData, [stepId, 'isLocked']);
export const isStepPending = (stepData, stepId: VMWizardTab) =>
  !!iGetIn(stepData, [stepId, 'isPending']);
export const hasStepAllRequiredFilled = (stepData, stepId: VMWizardTab) =>
  !!iGetIn(stepData, [stepId, 'hasAllRequiredFilled']);
