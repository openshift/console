import { getName } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  CREATED,
  CREATED_WITH_CLEANUP,
  CREATED_WITH_FAILED_CLEANUP,
  FAILED_TO_CREATE,
  FAILED_TO_PATCH,
} from '../../utils/strings';
import { getGeneratedName, getKind } from '../../selectors/selectors';
import { getFullResourceId } from '../../utils/utils';
import { EnhancedK8sMethods } from './enhancedK8sMethods';
import { Result, ResultContentType, ResultsWrapper } from './types';

const asResult = ({
  obj,
  data,
  type,
  message,
  isError,
}: {
  obj?: K8sResourceKind;
  data: any;
  type: ResultContentType;
  message: string;
  isError?: boolean;
}): Result => ({
  title: [getKind(obj), getName(obj) || getGeneratedName(obj), message].filter((a) => a).join(' '),
  content: {
    data,
    type,
  },
  isError,
});

export const cleanupAndGetResults = async (
  enhancedK8sMethods: EnhancedK8sMethods,
  { message, title, detail, failedObject, failedPatches },
): Promise<ResultsWrapper> => {
  const actualState = enhancedK8sMethods.getActualState(); // actual state will differ after cleanup

  let isFatal = false;
  let cleanupErrors;
  try {
    await enhancedK8sMethods.rollback();
  } catch (e) {
    // eslint-disable-next-line prefer-destructuring
    cleanupErrors = e.errors;
    isFatal = true;
  }

  const failedObjectsMap = {};

  if (cleanupErrors) {
    cleanupErrors.forEach((error) => {
      failedObjectsMap[getFullResourceId(error.failedObject)] = error.failedObject;
    });
  }

  const cleanupResults = actualState
    .map((resource) => {
      const failedToCleanup = !!failedObjectsMap[getFullResourceId(resource)];

      return asResult({
        obj: resource,
        data: resource,
        type: ResultContentType.YAML,
        message: failedToCleanup ? CREATED_WITH_FAILED_CLEANUP : CREATED_WITH_CLEANUP,
        isError: failedToCleanup,
      });
    })
    .reverse();

  const failureResults = [];
  if (failedPatches || failedObject) {
    failureResults.push(
      asResult({
        obj: failedObject,
        data: failedPatches || failedObject,
        type: failedPatches ? ResultContentType.JSON : ResultContentType.YAML,
        message: failedPatches ? FAILED_TO_PATCH : FAILED_TO_CREATE,
        isError: true,
      }),
    );
  }

  return {
    isFatal,
    isValid: false,
    mainError: { message, title, detail },
    errors: [],
    requestResults: [...failureResults, ...cleanupResults],
  };
};

export const getResults = (enhancedK8sMethods: EnhancedK8sMethods): ResultsWrapper => ({
  isFatal: false,
  isValid: true,
  mainError: null,
  errors: [],
  requestResults: enhancedK8sMethods
    .getActualState()
    .map((obj, idx, actualState) =>
      asResult({
        obj,
        data: obj,
        type: ResultContentType.YAML,
        message: actualState.length === 1 ? '' : CREATED,
      }),
    )
    .reverse(),
});

export const errorsFirstSort = (results: Result[]) =>
  results
    .map((result, sortIndex) => ({ ...result, sortIndex }))
    // move errors to the top
    .sort((a, b) => {
      if (a.isError === b.isError) {
        return a.sortIndex - b.sortIndex;
      }
      return a.isError ? -1 : 1;
    });
