import { iGetIn } from '../../../../utils/immutable';

export const isStepValid = (stepData, stepId: string) => !!iGetIn(stepData, [stepId, 'valid']);
export const isStepLocked = (stepData, stepId: string) => !!iGetIn(stepData, [stepId, 'locked']);
