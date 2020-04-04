import { assureEndsWith, joinGrammaticallyListOfItems, makeSentence } from '@console/shared/src';
import {
  ImportProvidersField,
  VMSettingsField,
  RenderableFieldResolver,
  VMWareProviderField,
  RenderableField,
  OvirtProviderField,
} from '../types';
import { helpResolver, placeholderResolver, titleResolver } from '../strings/renderable-field';
import * as _ from 'lodash';
import { iGetFieldKey } from '../selectors/immutable/field';
import { pluralize } from '../../../utils/strings';

const renderableFieldOrder: { [key in RenderableField]: number } = {
  [ImportProvidersField.PROVIDER]: 0,
  [OvirtProviderField.OVIRT_ENGINE_SECRET_NAME]: 1,
  [OvirtProviderField.API_URL]: 2,
  [OvirtProviderField.USERNAME]: 3,
  [OvirtProviderField.PASSWORD]: 4,
  [OvirtProviderField.REMEMBER_PASSWORD]: 5,
  [OvirtProviderField.CERTIFICATE]: 6,
  [OvirtProviderField.CLUSTER]: 7,
  [OvirtProviderField.VM]: 8,
  [OvirtProviderField.STATUS]: 9,
  [ImportProvidersField.PROVIDER]: 10,
  [VMWareProviderField.VCENTER]: 11,
  [VMWareProviderField.HOSTNAME]: 12,
  [VMWareProviderField.USER_NAME]: 13,
  [VMWareProviderField.USER_PASSWORD_AND_CHECK_CONNECTION]: 14,
  [VMWareProviderField.REMEMBER_PASSWORD]: 15,
  [VMWareProviderField.VM]: 16,
  [VMWareProviderField.STATUS]: 17,
  [VMSettingsField.NAME]: 18,
  [VMSettingsField.DESCRIPTION]: 19,
  [VMSettingsField.USER_TEMPLATE]: 20,
  [VMSettingsField.PROVISION_SOURCE_TYPE]: 21,
  [VMSettingsField.CONTAINER_IMAGE]: 22,
  [VMSettingsField.IMAGE_URL]: 23,
  [VMSettingsField.OPERATING_SYSTEM]: 24,
  [VMSettingsField.FLAVOR]: 25,
  [VMSettingsField.MEMORY]: 26,
  [VMSettingsField.CPU]: 27,
  [VMSettingsField.WORKLOAD_PROFILE]: 28,
  [VMSettingsField.START_VM]: 29,
};

const idResolver: RenderableFieldResolver = {
  [ImportProvidersField.PROVIDER]: 'provider-dropdown',
  [OvirtProviderField.OVIRT_ENGINE_SECRET_NAME]: 'ovirt-engine-dropdown',
  [OvirtProviderField.API_URL]: 'ovirt-engine-api-url',
  [OvirtProviderField.USERNAME]: 'ovirt-engine-username',
  [OvirtProviderField.PASSWORD]: 'ovirt-engine-password',
  [OvirtProviderField.REMEMBER_PASSWORD]: 'ovirt-engine-remember-credentials',
  [OvirtProviderField.CERTIFICATE]: 'ovirt-engine-certificate',
  [OvirtProviderField.CLUSTER]: 'ovirt-cluster-dropdown',
  [OvirtProviderField.VM]: 'ovirt-vm-dropdown',
  [OvirtProviderField.STATUS]: 'ovirt-engine-status',
  [VMWareProviderField.VCENTER]: 'vcenter-instance-dropdown',
  [VMWareProviderField.HOSTNAME]: 'vcenter-hostname-dropdown',
  [VMWareProviderField.USER_NAME]: 'vcenter-username',
  [VMWareProviderField.USER_PASSWORD_AND_CHECK_CONNECTION]: 'vcenter-password',
  [VMWareProviderField.REMEMBER_PASSWORD]: 'vcenter-remember-credentials',
  [VMWareProviderField.STATUS]: 'vcenter-status',
  [VMWareProviderField.VM]: 'vcenter-vm-dropdown',
  [VMSettingsField.NAME]: 'vm-name',
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
