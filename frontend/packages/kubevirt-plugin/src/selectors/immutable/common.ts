import { iGetIn } from '../../utils/immutable';
import { ILabels } from '../../types/template';

export const iGetLabels = (obj): ILabels => iGetIn(obj, ['metadata', 'labels']);
export const iGetCreationTimestamp = (obj): string =>
  iGetIn(obj, ['metadata', 'creationTimestamp']);
