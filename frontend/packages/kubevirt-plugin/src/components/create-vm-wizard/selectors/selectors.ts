import { iGetIn, immutableListToShallowJS, toShallowJS } from '../../../utils/immutable';
import { VMWizardNetwork, VMWizardStorage, VMWizardTab } from '../types';
import { getCreateVMWizards } from './common';
import { FirehoseResourceEnhanced } from '../../../types/custom';

export const getExtraWSQueries = (state, reduxID: string): FirehoseResourceEnhanced[] => {
  const wizards = getCreateVMWizards(state);
  const iWSQueries = iGetIn(wizards, [reduxID, 'extraWSQueries']);
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

export const getGoToStep = (state, reduxID: string): VMWizardTab => {
  const wizards = getCreateVMWizards(state);
  return iGetIn(wizards, [reduxID, 'transient', 'goToStep']);
};

export const getNetworks = (state, id: string): VMWizardNetwork[] =>
  immutableListToShallowJS(
    iGetIn(getCreateVMWizards(state), [id, 'tabs', VMWizardTab.NETWORKING, 'value']),
  );

export const getStorages = (state, id: string): VMWizardStorage[] =>
  immutableListToShallowJS(
    iGetIn(getCreateVMWizards(state), [id, 'tabs', VMWizardTab.STORAGE, 'value']),
  );
