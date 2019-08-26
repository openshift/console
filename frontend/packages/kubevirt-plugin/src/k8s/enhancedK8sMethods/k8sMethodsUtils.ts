import { getName } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  CREATED,
  CREATED_WITH_CLEANUP,
  CREATED_WITH_FAILED_CLEANUP,
  ERROR,
  FAILED_TO_CREATE,
  FAILED_TO_PATCH,
} from '../../utils/strings';
import { getGeneratedName, getKind } from '../../selectors/selectors';
import { getFullResourceId } from '../../utils/utils';
import { EnhancedK8sMethods } from './enhancedK8sMethods';

const k8sObjectToResult = ({
  obj,
  content,
  message,
  isExpanded,
  isError,
}: {
  obj?: K8sResourceKind;
  content: any;
  message: string;
  isExpanded?: boolean;
  isError?: boolean;
}) => ({
  title: [getKind(obj), getName(obj) || getGeneratedName(obj), message].filter((a) => a).join(' '),
  content,
  isExpanded,
  isError,
});

type Result = {
  title: string;
  content: any;
  isExpanded: boolean;
  isError: boolean;
};

type ResultsWrapper = {
  isValid: boolean;
  results: Result[];
};

export const cleanupAndGetResults = async (
  enhancedK8sMethods,
  { message, failedObject, failedPatches },
): Promise<ResultsWrapper> => {
  const actualState = enhancedK8sMethods.getActualState(); // actual state will differ after cleanup

  let errors;
  try {
    await enhancedK8sMethods.rollback();
  } catch (e) {
    // eslint-disable-next-line prefer-destructuring
    errors = e.errors;
  }

  const failedObjectsMap = {};

  if (errors) {
    errors.forEach((error) => {
      failedObjectsMap[getFullResourceId(error.failedObject)] = error.failedObject;
    });
  }

  const cleanupArray = actualState
    .map((resource) => {
      const failedToCleanup = !!failedObjectsMap[getFullResourceId(resource)];

      return k8sObjectToResult({
        obj: resource,
        content: resource,
        message: failedToCleanup ? CREATED_WITH_FAILED_CLEANUP : CREATED_WITH_CLEANUP,
        isExpanded: failedToCleanup,
        isError: failedToCleanup,
      });
    })
    .reverse();

  const errorResults = [
    k8sObjectToResult({
      content: message,
      message: ERROR,
      isExpanded: true,
      isError: true,
    }),
  ];

  if (failedPatches || failedObject) {
    errorResults.push(
      k8sObjectToResult({
        obj: failedObject,
        content: failedPatches || failedObject,
        message: failedPatches ? FAILED_TO_PATCH : FAILED_TO_CREATE,
        isError: true,
      }),
    );
  }

  return {
    isValid: false,
    results: [...errorResults, ...cleanupArray],
  };
};

export const getResults = (enhancedK8sMethods: EnhancedK8sMethods): ResultsWrapper => ({
  isValid: true,
  results: enhancedK8sMethods
    .getActualState()
    .map((obj) => k8sObjectToResult({ obj, content: obj, message: CREATED }))
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
