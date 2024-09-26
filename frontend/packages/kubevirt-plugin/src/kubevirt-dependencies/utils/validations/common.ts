import { getName, getNamespace } from '../../selectors/k8sCommon';
import { asValidationObject, ValidationObject } from '../../selectors/types';

export const validateEntityAlreadyExists = (
  name,
  namespace,
  entities,
  { errorMessage } = { errorMessage: undefined },
): ValidationObject => {
  const exists =
    entities &&
    entities.some((entity) => getName(entity) === name && getNamespace(entity) === namespace);
  return exists ? asValidationObject(errorMessage) : null;
};
