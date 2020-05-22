import * as _ from 'lodash';
import { ClusterServiceVersionKind, CRDDescription } from './types';
import { referenceForProvidedAPI } from './components';

export const getInternalObjects = (csv: any, path: string = 'metadata.annotations') => {
  const internals: string = _.get(csv, [
    ..._.toPath(path),
    'operators.operatorframework.io/internal-objects',
  ]);
  if (!internals) {
    return [];
  }
  try {
    return JSON.parse(internals);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error parsing internal object annotation.', e);
    return [];
  }
};

export const isInternalObject = (internalObjects: string[], objectName: string): boolean =>
  internalObjects.some((obj) => obj === objectName);

export const getInternalAPIReferences = (csv: ClusterServiceVersionKind): string[] => {
  const owned: CRDDescription[] = csv?.spec?.customresourcedefinitions?.owned || [];
  const internalObjects = getInternalObjects(csv);
  return owned.reduce(
    (acc, obj) =>
      isInternalObject(internalObjects, obj.name) ? [referenceForProvidedAPI(obj), ...acc] : acc,
    [],
  );
};
