import i18next from 'i18next';
import { JobKind } from './types';

export const getJobTypeAndCompletions = ({ spec }: JobKind) => {
  // if neither completions nor parallelism are defined, then it is a non-parallel job.
  if (!spec.completions && !spec.parallelism) {
    return { type: i18next.t('public~Non-parallel'), completions: 1 };
  }
  // if completions are defined and no parallelism is defined, or if parallelism is 0 or 1, then it is a 'Non-parallel' job.
  if (spec.completions && (!spec.parallelism || spec.parallelism === 1)) {
    return { type: i18next.t('public~Non-parallel'), completions: spec.completions };
  }
  // if parallelism is greater than 1 and completions are defined, then it is a 'Fixed Completion Count' job.
  if (spec.hasOwnProperty('parallelism') && spec.completions) {
    return { type: i18next.t('public~Fixed completion count'), completions: spec.completions };
  }
  // otherwise, if parallelism is defined, but completions is not, then it is a 'Work Queue' job.
  return { type: i18next.t('public~Work queue'), completions: 1 };
};
