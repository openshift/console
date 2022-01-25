import {
  TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER,
  TEMPLATE_BASE_IMAGE_NAME_PARAMETER,
  TEMPLATE_DATA_SOURCE_NAMESPACE_PARAMETER,
  TEMPLATE_DATA_SOURCE_NAME_PARAMETER,
} from '../../constants';
import { ILabels } from '../../types/template';
import { iGetIn } from '../../utils/immutable';

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

export const iGetPVCName = (obj): any =>
  iGetPrameterValue(obj, TEMPLATE_BASE_IMAGE_NAME_PARAMETER) ||
  iGetPrameterValue(obj, TEMPLATE_DATA_SOURCE_NAME_PARAMETER);

export const iGetPVCNamespace = (obj): any =>
  iGetPrameterValue(obj, TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER) ||
  iGetPrameterValue(obj, TEMPLATE_DATA_SOURCE_NAMESPACE_PARAMETER);
