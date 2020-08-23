import { iGetVmSettings } from '../selectors/immutable/vm-settings';
import { getEmptyRequiredFields, getInvalidFields } from '../redux/validations/utils';
import { getFieldReadableTitle, sortFields } from '../utils/renderable-field-utils';
import * as _ from 'lodash';
import { VMWizardTab } from '../types';
import { TabTitleResolver } from '../strings/strings';
import { Error } from './types';
import { iGetNetworks } from '../selectors/immutable/networks';
import { iGetIn, toJS } from '../../../utils/immutable';
import { joinGrammaticallyListOfItems } from '@console/shared/src';
import { getValidationNameByKey } from '../../../utils/validations/strings';
import { iGetStorages } from '../selectors/immutable/storage';
import {
  INSUFFICIENT_PERMISSIONS_ERROR_TITLE,
  INSUFFICIENT_PERMISSIONS_ERROR_DESC,
} from '../../../constants/errors/common';

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
  ).map((field) => {
    const fieldKey = field.get('key');
    return {
      id: fieldKey,
      path: [
        {
          id: VMWizardTab.VM_SETTINGS,
          name: TabTitleResolver[VMWizardTab.VM_SETTINGS],
        },
        {
          id: 'field',
          name: getFieldReadableTitle(fieldKey),
          action: {
            goToStep: VMWizardTab.VM_SETTINGS,
          },
        },
      ],
    } as Error;
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
  ).map((nic) => {
    const validations = toJS(nic.getIn(['validation', 'validations']), {});
    return {
      id: `nic:${nic.get('id')}`,
      path: [
        {
          id: VMWizardTab.NETWORKING,
          name: TabTitleResolver[VMWizardTab.NETWORKING],
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
    } as Error;
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
  ).map((iStorage) => {
    const validations = toJS(iStorage.getIn(['validation', 'validations']), {});
    const tab = VMWizardTab.STORAGE;
    return {
      id: `storage:${iStorage.get('id')}`,
      path: [
        {
          id: tab,
          name: TabTitleResolver[tab],
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
    } as Error;
  });

  const isValid = hasAllRequiredFilled && invalidStorages.length === 0;

  return { hasAllRequiredFilled, isValid, errors };
};

const isPermissionError = (title: string, message: string): boolean =>
  title.includes('roles.rbac.authorization.k8s.io') ||
  message.includes('roles.rbac.authorization.k8s.io');

type FormattedErrorMessage = {
  isLong: boolean;
  errTitle: string;
  description: string;
};

export const formatError = (errTitle: string, message: string): FormattedErrorMessage => {
  if (!/\n/.test(message)) {
    return { isLong: false, errTitle, description: null };
  }

  if (isPermissionError(errTitle, message)) {
    return {
      isLong: true,
      errTitle: INSUFFICIENT_PERMISSIONS_ERROR_TITLE,
      description: INSUFFICIENT_PERMISSIONS_ERROR_DESC,
    };
  }

  const [desc] = message.split('\n');
  return { isLong: true, errTitle, description: desc };
};
