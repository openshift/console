import * as _ from 'lodash';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager';
import { DataValidator, DataState, ErrorType, Field } from './types';

export const getValidJSON: DataValidator = (fName, fData) => {
  if (!fName.includes('json')) {
    return { isValid: false, errorMessage: 'File is not a valid JSON file' };
  }
  try {
    // Just see if it fails
    const parsedData = JSON.parse(fData);
    return { isValid: true, parsedData };
  } catch (e) {
    return { isValid: false, errorMessage: 'File content is not parsable.' };
  }
};

export const checkError = (data: DataState): ErrorType[] => {
  const errors: ErrorType[] = [];
  for (const key in data) {
    if (!_.isNull(data[key]) && _.isEmpty(_.trim(data[key])))
      errors.push({ field: key as Field, message: `${key} cannot be empty` });
    else errors.push({ field: key as Field, message: '' });
  }
  return errors;
};

export const checkForIndependentSupport = (csv: ClusterServiceVersionKind): boolean => {
  const independent: string =
    csv.metadata.annotations?.['external.cluster.ocs.openshift.io/supported'];
  return independent === 'true';
};
