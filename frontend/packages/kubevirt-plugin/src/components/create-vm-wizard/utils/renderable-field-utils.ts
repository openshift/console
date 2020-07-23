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
  [OvirtProviderField.CERTIFICATE]: 3,
  [OvirtProviderField.USERNAME]: 4,
  [OvirtProviderField.PASSWORD]: 5,
  [OvirtProviderField.REMEMBER_PASSWORD]: 6,
  [OvirtProviderField.CLUSTER]: 7,
  [OvirtProviderField.VM]: 8,
  [OvirtProviderField.STATUS]: 9,
  [ImportProvidersField.PROVIDER]: 10,
  [VMWareProviderField.VCENTER_SECRET_NAME]: 11,
  [VMWareProviderField.HOSTNAME]: 12,
  [VMWareProviderField.USERNAME]: 13,
  [VMWareProviderField.PASSWORD]: 14,
  [VMWareProviderField.REMEMBER_PASSWORD]: 15,
  [VMWareProviderField.VM]: 16,
  [VMWareProviderField.STATUS]: 17,
  [VMSettingsField.NAME]: 18,
  [VMSettingsField.DESCRIPTION]: 19,
  [VMSettingsField.USER_TEMPLATE]: 20,
  [VMSettingsField.OPERATING_SYSTEM]: 21,
  [VMSettingsField.FLAVOR]: 22,
  [VMSettingsField.MEMORY]: 23,
  [VMSettingsField.CPU]: 24,
  [VMSettingsField.WORKLOAD_PROFILE]: 25,
  [VMSettingsField.PROVISION_SOURCE_TYPE]: 26,
  [VMSettingsField.CONTAINER_IMAGE]: 27,
  [VMSettingsField.IMAGE_URL]: 28,
  [VMSettingsField.START_VM]: 29,
};

const idResolver: RenderableFieldResolver = {
  [ImportProvidersField.PROVIDER]: 'provider-dropdown',
  [OvirtProviderField.OVIRT_ENGINE_SECRET_NAME]: 'ovirt-engine-dropdown',
  [OvirtProviderField.API_URL]: 'ovirt-engine-api-url',
  [OvirtProviderField.CERTIFICATE]: 'ovirt-engine-certificate',
  [OvirtProviderField.USERNAME]: 'ovirt-engine-username',
  [OvirtProviderField.PASSWORD]: 'ovirt-engine-password',
  [OvirtProviderField.REMEMBER_PASSWORD]: 'ovirt-engine-remember-credentials',
  [OvirtProviderField.CLUSTER]: 'ovirt-cluster-dropdown',
  [OvirtProviderField.VM]: 'ovirt-vm-dropdown',
  [OvirtProviderField.STATUS]: 'ovirt-engine-status',
  [VMWareProviderField.VCENTER_SECRET_NAME]: 'vcenter-instance-dropdown',
  [VMWareProviderField.HOSTNAME]: 'vcenter-hostname-dropdown',
  [VMWareProviderField.USERNAME]: 'vcenter-username',
  [VMWareProviderField.PASSWORD]: 'vcenter-password',
  [VMWareProviderField.REMEMBER_PASSWORD]: 'vcenter-remember-credentials',
  [VMWareProviderField.STATUS]: 'vcenter-status',
  [VMWareProviderField.VM]: 'vcenter-vm-dropdown',
  [VMSettingsField.NAME]: 'vm-name',
  [VMSettingsField.DESCRIPTION]: 'vm-description',
  [VMSettingsField.USER_TEMPLATE]: 'template-dropdown',
  [VMSettingsField.OPERATING_SYSTEM]: 'operating-system-dropdown',
  [VMSettingsField.FLAVOR]: 'flavor-dropdown',
  [VMSettingsField.MEMORY]: 'resources-memory',
  [VMSettingsField.CPU]: 'resources-cpu',
  [VMSettingsField.WORKLOAD_PROFILE]: 'workload-profile-dropdown',
  [VMSettingsField.START_VM]: 'start-vm',
  [VMSettingsField.PROVISION_SOURCE_TYPE]: 'image-source-type-dropdown',
  [VMSettingsField.CONTAINER_IMAGE]: 'provision-source-container',
  [VMSettingsField.IMAGE_URL]: 'provision-source-url',
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
