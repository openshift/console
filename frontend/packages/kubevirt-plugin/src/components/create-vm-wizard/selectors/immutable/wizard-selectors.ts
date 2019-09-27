import { iGetIn } from '../../../../utils/immutable';

export const isStepValid = (stepData, stepId: string) => !!iGetIn(stepData, [stepId, 'isValid']);
export const isStepLocked = (stepData, stepId: string) => !!iGetIn(stepData, [stepId, 'isLocked']);
export const hasStepAllRequiredFilled = (stepData, stepId: string) =>
  !!iGetIn(stepData, [stepId, 'hasAllRequiredFilled']);
