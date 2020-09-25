import { iGetIn } from '../../utils/immutable';
import { ILabels } from '../../types/template';

export const iGetLabels = (obj): ILabels => iGetIn(obj, ['metadata', 'labels']);
export const iGetCreationTimestamp = (obj): string =>
  iGetIn(obj, ['metadata', 'creationTimestamp']);
export const iGetPrameterValue = (obj, name: string, defaultValue = null): any => {
  const parameter = iGetIn(obj, ['parameters'])
    ?.valueSeq()
    .find((p) => iGetIn(p, ['name']) === name);

  return iGetIn(parameter, ['value'], defaultValue);
};
export const iGetAnnotation = (obj, key: string, defaultValue = undefined): string =>
  iGetIn(obj, ['metadata', 'annotations', key], defaultValue);
