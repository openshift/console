import { K8sResourceKind } from '@console/internal/module/k8s';
import { iGetIn, iGetLoadedData } from '../../../../utils/immutable';
import { CommonDataProp, VMWizardTab } from '../../types';
import { iGetCreateVMWizard, iGetCreateVMWizardTabs } from './common';

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
    !!iGetIn(tabs, [tab, 'isValid']) !== nextIsValid ||
    !!iGetIn(tabs, [tab, 'hasAllRequiredFilled']) !== nextHasAllRequiredFilled ||
    iGetIn(tabs, [tab, 'error']) !== nextError
  );
};

export const iGetCommonData = <RESULT = any>(
  state,
  reduxID: string,
  key: CommonDataProp,
): RESULT => {
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
