import { TektonParam } from '../types';

export const paramIsRequired = (param: TektonParam): boolean => {
  return !('default' in param);
};
