import * as _ from 'lodash';
import { joinGrammaticallyListOfItems } from '@console/shared/src';
import { iGetIn, toJS } from '../../../utils/immutable';
import { getValidationNameByKey } from '../../../utils/validations/strings';
import { getEmptyRequiredFields, getInvalidFields } from '../redux/validations/utils';
import { iGetNetworks } from '../selectors/immutable/networks';
import { iGetStorages } from '../selectors/immutable/storage';
import { iGetVmSettings } from '../selectors/immutable/vm-settings';
import { TabTitleKeyResolver } from '../strings/strings';
import { VMWizardTab } from '../types';
import { getFieldTitleKey, sortFields } from '../utils/renderable-field-utils';
import { Error } from './types';

export const computeVMSettingsErrors = (state, wizardReduxID) => {
  const vmSettingsFields = iGetVmSettings(state, wizardReduxID);
  // check if all required fields are defined
  const emptyRequiredFields = getEmptyRequiredFields(vmSettingsFields);
  const hasAllRequiredFilled = emptyRequiredFields.length === 0;

  // check if fields are valid
  const invalidFields = getInvalidFields(vmSettingsFields);
  const isValid = hasAllRequiredFilled && invalidFields.length === 0;

  const errors = sortFields(
    _.uniqBy([...emptyRequiredFields, ...invalidFields], (field) => field.get('key')),
  ).map<Error>((field) => {
    const fieldKey = field.get('key');
    return {
      id: fieldKey,
      path: [
        {
          id: VMWizardTab.VM_SETTINGS,
          nameKey: TabTitleKeyResolver[VMWizardTab.VM_SETTINGS],
        },
        {
          id: 'field',
          nameKey: getFieldTitleKey(fieldKey),
          action: {
            goToStep: VMWizardTab.VM_SETTINGS,
          },
        },
      ],
    };
  });
  return { hasAllRequiredFilled, isValid, errors };
};

export const computeNetworkErrors = (state, wizardReduxID) => {
  const iNetworks = iGetNetworks(state, wizardReduxID);

  const emptyRequiredNICs = iNetworks
    .filter((iNetwork) => !iGetIn(iNetwork, ['validation', 'hasAllRequiredFilled']))
    .toArray();
  const hasAllRequiredFilled = emptyRequiredNICs.length === 0;

  const invalidNICs = iNetworks
    .filter((iNetwork) => !iGetIn(iNetwork, ['validation', 'isValid']))
    .toArray();

  const errors = _.sortedUniqBy(
    _.sortBy([...emptyRequiredNICs, ...invalidNICs], (nic) =>
      nic.getIn(['networkInterface', 'name']),
    ),
    (nic) => nic.getIn(['networkInterface', 'name']),
  ).map<Error>((nic) => {
    const validations = toJS(nic.getIn(['validation', 'validations']), {});
    return {
      id: `nic:${nic.get('id')}`,
      path: [
        {
          id: VMWizardTab.NETWORKING,
          nameKey: TabTitleKeyResolver[VMWizardTab.NETWORKING],
        },
        {
          id: 'nic',
          name: nic.getIn(['networkInterface', 'name']),
        },
        {
          id: 'nic-fields',
          name:
            validations &&
            joinGrammaticallyListOfItems(
              Object.keys(validations)
                .filter((k) => validations[k])
                .map(getValidationNameByKey),
            ),
          action: {
            goToStep: VMWizardTab.NETWORKING,
            openModal: {
              wizardReduxID,
              showInitialValidation: true,
              nicModal: {
                iNIC: nic,
              },
            },
          },
        },
      ],
    };
  });

  const isValid = hasAllRequiredFilled && invalidNICs.length === 0;

  return { hasAllRequiredFilled, isValid, errors };
};

export const computeStorageErrors = (state, wizardReduxID) => {
  const iStorages = iGetStorages(state, wizardReduxID);

  const emptyRequiredStorages = iStorages
    .filter((iNetwork) => !iGetIn(iNetwork, ['validation', 'hasAllRequiredFilled']))
    .toArray();
  const hasAllRequiredFilled = emptyRequiredStorages.length === 0;

  const invalidStorages = iStorages
    .filter((iNetwork) => !iGetIn(iNetwork, ['validation', 'isValid']))
    .toArray();

  const errors = _.sortedUniqBy(
    _.sortBy([...emptyRequiredStorages, ...invalidStorages], (storage) =>
      storage.getIn(['disk', 'name']),
    ),
    (storage) => storage.getIn(['disk', 'name']),
  ).map<Error>((iStorage) => {
    const validations = toJS(iStorage.getIn(['validation', 'validations']), {});
    const tab = VMWizardTab.STORAGE;
    return {
      id: `storage:${iStorage.get('id')}`,
      path: [
        {
          id: tab,
          nameKey: TabTitleKeyResolver[tab],
        },
        {
          id: 'disk',
          name: iStorage.getIn(['disk', 'name']),
        },
        {
          id: 'storage-fields',
          name:
            validations &&
            joinGrammaticallyListOfItems(
              Object.keys(validations)
                .filter((k) => validations[k])
                .map(getValidationNameByKey),
            ),
          action: {
            goToStep: tab,
            openModal: {
              wizardReduxID,
              showInitialValidation: true,
              diskModal: {
                iStorage,
              },
            },
          },
        },
      ],
    };
  });

  const isValid = hasAllRequiredFilled && invalidStorages.length === 0;

  return { hasAllRequiredFilled, isValid, errors };
};
