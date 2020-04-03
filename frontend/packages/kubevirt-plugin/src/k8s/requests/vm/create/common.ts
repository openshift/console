import { TemplateKind } from '@console/internal/module/k8s';
import { getName, getNamespace } from '@console/shared/src';
import { VMSettingsField } from '../../../../components/create-vm-wizard/types';
import { getFieldValue } from '../../../../components/create-vm-wizard/selectors/vm-settings';
import {
  ANNOTATION_DESCRIPTION,
  LABEL_USED_TEMPLATE_NAME,
  LABEL_USED_TEMPLATE_NAMESPACE,
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_OS_NAME_ANNOTATION,
  TEMPLATE_WORKLOAD_LABEL,
  TEMPLATE_VM_DOMAIN_LABEL,
  TEMPLATE_VM_NAME_LABEL,
  APP,
} from '../../../../constants/vm';
import { VMWrapper } from '../../../wrapper/vm/vm-wrapper';
import { getTemplateOperatingSystems } from '../../../../selectors/vm-template/advanced';
import { VMTemplateWrapper } from '../../../wrapper/vm/vm-template-wrapper';
import { operatingSystemsNative } from '../../../../components/create-vm-wizard/native/consts';
import { concatImmutableLists, immutableListToShallowJS } from '../../../../utils/immutable';
import { CreateVMParams } from './types';

export const getOS = ({
  vmSettings,
  iUserTemplates,
  openshiftFlag,
  iCommonTemplates,
}: CreateVMParams) => {
  const operatingSystems = openshiftFlag
    ? getTemplateOperatingSystems(
        immutableListToShallowJS<TemplateKind>(
          concatImmutableLists(iUserTemplates, iCommonTemplates),
        ),
      )
    : operatingSystemsNative;

  const osID = getFieldValue(vmSettings, VMSettingsField.OPERATING_SYSTEM);
  return {
    osID,
    osName: (operatingSystems.find(({ id }) => id === osID) || {}).name,
  };
};

export const initializeCommonMetadata = (
  settings: {
    [VMSettingsField.DESCRIPTION]: string;
    [VMSettingsField.FLAVOR]: string;
    [VMSettingsField.WORKLOAD_PROFILE]: string;
    osID: string;
    osName: string;
  },
  entity: VMWrapper | VMTemplateWrapper,
  template?: TemplateKind,
) => {
  entity.addAnotation(`${TEMPLATE_OS_NAME_ANNOTATION}/${settings.osID}`, settings.osName);

  if (settings[VMSettingsField.DESCRIPTION]) {
    entity.addAnotation(ANNOTATION_DESCRIPTION, settings[VMSettingsField.DESCRIPTION]);
  }

  entity.addLabel(`${TEMPLATE_OS_LABEL}/${settings.osID}`, 'true');
  entity.addLabel(`${TEMPLATE_FLAVOR_LABEL}/${settings[VMSettingsField.FLAVOR]}`, 'true');

  if (settings[VMSettingsField.WORKLOAD_PROFILE]) {
    entity.addLabel(
      `${TEMPLATE_WORKLOAD_LABEL}/${settings[VMSettingsField.WORKLOAD_PROFILE]}`,
      'true',
    );
  }

  if (template) {
    entity.addLabel(LABEL_USED_TEMPLATE_NAME, getName(template));
    entity.addLabel(LABEL_USED_TEMPLATE_NAMESPACE, getNamespace(template));
  }

  return entity;
};

export const initializeCommonVMMetadata = (
  settings: {
    [VMSettingsField.NAME]: string;
    [VMSettingsField.FLAVOR]: string;
    [VMSettingsField.WORKLOAD_PROFILE]: string;
    osID: string;
  },
  entity: VMWrapper,
) => {
  const name = settings[VMSettingsField.NAME];

  entity.addTemplateLabel(TEMPLATE_VM_NAME_LABEL, name); // for pairing service-vm (like for RDP)

  if (!entity.hasTemplateLabel(TEMPLATE_VM_DOMAIN_LABEL)) {
    entity.addTemplateLabel(TEMPLATE_VM_DOMAIN_LABEL, name);
  }

  if (!entity.hasLabel(APP)) {
    entity.addLabel(APP, name);
  }

  // show metadata inside a VMI

  entity.addTemplateLabel(`${TEMPLATE_OS_LABEL}/${settings.osID}`, 'true');
  entity.addTemplateLabel(`${TEMPLATE_FLAVOR_LABEL}/${settings[VMSettingsField.FLAVOR]}`, 'true');

  if (settings[VMSettingsField.WORKLOAD_PROFILE]) {
    entity.addTemplateLabel(
      `${TEMPLATE_WORKLOAD_LABEL}/${settings[VMSettingsField.WORKLOAD_PROFILE]}`,
      'true',
    );
  }
};
