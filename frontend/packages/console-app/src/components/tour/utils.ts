import { FeatureState } from '@console/internal/reducers/features';
import { Step } from './type';

/**
 * filter utils
 */

export const filterTourBasedonPermissionAndFlag = (steps: Step[], flags: FeatureState): Step[] =>
  steps.reduce((acc: Step[], step: Step) => {
    const { flags: stepFlags, access, selector } = step;
    if (stepFlags && stepFlags.filter((flag) => !flags[flag]).length > 0) return acc;
    if (access && !access()) return acc;
    // if the access and flag both check passes but the element is not present in the dom
    if (selector && !document.querySelector(selector)) return acc;
    acc.push(step);
    return acc;
  }, [] as Step[]);
