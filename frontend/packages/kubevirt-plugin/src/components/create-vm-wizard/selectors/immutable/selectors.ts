import { K8sResourceKind } from '@console/internal/module/k8s';
import { iGet, iGetIn, iGetLoadedData, toShallowJS } from '../../../../utils/immutable';
import { getCreateVMWizards } from '../selectors';
import { CommonDataProp, VMWizardTab } from '../../types';
import { getStepError, hasStepAllRequiredFilled, isStepValid } from './wizard-selectors';

export const iGetCreateVMWizard = (state, reduxID: string) =>
  iGet(getCreateVMWizards(state), reduxID);
export const iGetCreateVMWizardTabs = (state, reduxID: string) =>
  iGet(iGetCreateVMWizard(state, reduxID), 'tabs');

export const checkTabValidityChanged = (
  state,
  reduxID: string,
  tab: VMWizardTab,
  nextIsValid: boolean,
  nextHasAllRequiredFilled: boolean,
  nextError,
) => {
  const tabs = iGetCreateVMWizardTabs(state, reduxID);
  return (
    isStepValid(tabs, tab) !== nextIsValid ||
    hasStepAllRequiredFilled(tabs, tab) !== nextHasAllRequiredFilled ||
    getStepError(tabs, tab) !== nextError
  );
};

export const iGetExtraWSQueries = (state, reduxID: string) => {
  const wizard = iGetCreateVMWizard(state, reduxID);
  const iWSQueries = iGetIn(wizard, ['extraWSQueries']);
  if (iWSQueries == null) {
    return [];
  }

  const wsQueries = toShallowJS(iWSQueries, {});

  return Object.keys(wsQueries).reduce((acc, key) => {
    const addon = wsQueries[key];
    if (addon) {
      acc.push(...addon);
    }
    return acc;
  }, []);
};

export const iGetCommonData = (state, reduxID: string, key: CommonDataProp) => {
  const wizard = iGetCreateVMWizard(state, reduxID);
  const data = iGetIn(wizard, ['commonData', 'data', key]);
  if (data !== undefined) {
    return data;
  }

  const dataRefererence = iGetIn(wizard, ['commonData', 'dataIDReferences', key]);

  if (dataRefererence && dataRefererence.size > 0) {
    const firstStep = state[dataRefererence.first()];

    return firstStep && firstStep.getIn(dataRefererence.skip(1));
  }
  return undefined;
};

export const iGetName = (o) =>
  iGetIn(o, ['metadata', 'name']) as K8sResourceKind['metadata']['name'];
export const iGetUID = (o) => iGetIn(o, ['metadata', 'uid']) as K8sResourceKind['metadata']['uid'];
export const iGetNamespace = (o) =>
  iGetIn(o, ['metadata', 'namespace']) as K8sResourceKind['metadata']['namespace'];

export const iGetLoadedCommonData = (
  state,
  reduxID: string,
  key: CommonDataProp,
  defaultValue = undefined,
) => iGetLoadedData(iGetCommonData(state, reduxID, key), defaultValue);

export const immutableListToShallowMetadataJS = (list, defaultValue = []) =>
  list
    ? list.toArray().map((p) => ({
        metadata: {
          name: iGetName(p),
          namespace: iGetNamespace(p),
          uid: iGetUID(p),
        },
      }))
    : defaultValue;
