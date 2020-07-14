import { iGetIn } from '../../utils/immutable';
import { ILabels, IAnnotaions } from '../../types/template';

export const iGetLabels = (obj): ILabels => iGetIn(obj, ['metadata', 'labels']);
export const iGetAnnotations = (obj): IAnnotaions => iGetIn(obj, ['metadata', 'annotations']);
export const iGetCreationTimestamp = (obj): string =>
  iGetIn(obj, ['metadata', 'creationTimestamp']);
