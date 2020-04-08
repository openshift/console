import { assureEndsWith, joinGrammaticallyListOfItems, makeSentence } from '@console/shared/src';
import {
  ImportProvidersField,
  VMSettingsField,
  RenderableFieldResolver,
  VMWareProviderField,
  RenderableField,
} from '../types';
import { helpResolver, placeholderResolver, titleResolver } from '../strings/renderable-field';
import * as _ from 'lodash';
import { iGetFieldKey } from '../selectors/immutable/field';
import { pluralize } from '../../../utils/strings';

const renderableFieldOrder: { [key in RenderableField]: number } = {
  [ImportProvidersField.PROVIDER]: 0,
  [VMWareProviderField.VCENTER]: 1,
  [VMWareProviderField.HOSTNAME]: 2,
  [VMWareProviderField.USER_NAME]: 3,
  [VMWareProviderField.USER_PASSWORD_AND_CHECK_CONNECTION]: 4,
  [VMWareProviderField.REMEMBER_PASSWORD]: 5,
  [VMWareProviderField.VM]: 6,
  [VMWareProviderField.STATUS]: 7,
  [VMSettingsField.NAME]: 8,
  [VMSettingsField.DESCRIPTION]: 9,
  [VMSettingsField.USER_TEMPLATE]: 10,
  [VMSettingsField.PROVISION_SOURCE_TYPE]: 11,
  [VMSettingsField.CONTAINER_IMAGE]: 12,
  [VMSettingsField.IMAGE_URL]: 13,
  [VMSettingsField.OPERATING_SYSTEM]: 14,
  [VMSettingsField.FLAVOR]: 15,
  [VMSettingsField.MEMORY]: 16,
  [VMSettingsField.CPU]: 17,
  [VMSettingsField.WORKLOAD_PROFILE]: 18,
  [VMSettingsField.START_VM]: 19,
};

const idResolver: RenderableFieldResolver = {
  [ImportProvidersField.PROVIDER]: 'provider-dropdown',
  [VMWareProviderField.VCENTER]: 'vcenter-instance-dropdown',
  [VMWareProviderField.HOSTNAME]: 'vcenter-hostname-dropdown',
  [VMWareProviderField.USER_NAME]: 'vcenter-username',
  [VMWareProviderField.USER_PASSWORD_AND_CHECK_CONNECTION]: 'vcenter-password',
  [VMWareProviderField.REMEMBER_PASSWORD]: 'vcenter-remember-credentials',
  [VMWareProviderField.STATUS]: 'vcenter-status',
  [VMWareProviderField.VM]: 'vcenter-vm-dropdown',
  [VMSettingsField.NAME]: 'vm-name',
  [VMSettingsField.HOSTNAME]: 'vm-hostname',
  [VMSettingsField.DESCRIPTION]: 'vm-description',
  [VMSettingsField.USER_TEMPLATE]: 'template-dropdown',
  [VMSettingsField.PROVISION_SOURCE_TYPE]: 'image-source-type-dropdown',
  [VMSettingsField.CONTAINER_IMAGE]: 'provision-source-container',
  [VMSettingsField.IMAGE_URL]: 'provision-source-url',
  [VMSettingsField.OPERATING_SYSTEM]: 'operating-system-dropdown',
  [VMSettingsField.FLAVOR]: 'flavor-dropdown',
  [VMSettingsField.MEMORY]: 'resources-memory',
  [VMSettingsField.CPU]: 'resources-cpu',
  [VMSettingsField.WORKLOAD_PROFILE]: 'workload-profile-dropdown',
  [VMSettingsField.START_VM]: 'start-vm',
};

export const getFieldId = (key: RenderableField) => idResolver[key];
export const getFieldTitle = (key: RenderableField) => titleResolver[key];
export const getFieldReadableTitle = (key: RenderableField) => titleResolver[key];
export const getPlaceholder = (key: RenderableField) => placeholderResolver[key];
export const getFieldHelp = (key: RenderableField, value: string) => {
  const resolveFunction = helpResolver[key];
  return resolveFunction ? resolveFunction(value) : null;
};

export const sortFields = (fields: any[]) =>
  fields.sort((a, b) => {
    const aValue = renderableFieldOrder[iGetFieldKey(a)];
    const bValue = renderableFieldOrder[iGetFieldKey(b)];

    if (bValue == null) {
      return -1;
    }

    if (aValue == null) {
      return 1;
    }

    return aValue - bValue;
  });

export const describeFields = (describe: string, fields: object[]) => {
  if (fields && fields.length > 0) {
    const describedFields = _.compact(
      sortFields(fields).map((field) => getFieldReadableTitle(iGetFieldKey(field))),
    );
    return makeSentence(
      `${assureEndsWith(describe, ' ')}the following ${pluralize(
        fields.length,
        'field',
      )}: ${joinGrammaticallyListOfItems(describedFields)}.`,
      false,
    );
  }
  return null;
};
