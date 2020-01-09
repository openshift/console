import { TemplateKind } from '@console/internal/module/k8s';
import { getName, getNamespace } from '@console/shared/src';
import { VMSettingsField } from '../../../../components/create-vm-wizard/types';
import {
  asSimpleSettings,
  getFieldValue,
} from '../../../../components/create-vm-wizard/selectors/vm-settings';
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
import { MutableVMWrapper } from '../../../wrapper/vm/vm-wrapper';
import { getTemplateOperatingSystems } from '../../../../selectors/vm-template/advanced';
import { MutableVMTemplateWrapper } from '../../../wrapper/vm/vm-template-wrapper';
import { operatingSystemsNative } from '../../../../components/create-vm-wizard/native/consts';
import { concatImmutableLists, immutableListToShallowJS } from '../../../../utils/immutable';
import { CreateVMEnhancedParams } from './types';

export const initializeCommonMetadata = (
  { vmSettings, iUserTemplates, openshiftFlag, iCommonTemplates }: CreateVMEnhancedParams,
  entity: MutableVMWrapper | MutableVMTemplateWrapper,
  template?: TemplateKind,
) => {
  const settings = asSimpleSettings(vmSettings);
  const operatingSystems = openshiftFlag
    ? getTemplateOperatingSystems(
        immutableListToShallowJS<TemplateKind>(
          concatImmutableLists(iUserTemplates, iCommonTemplates),
        ),
      )
    : operatingSystemsNative;
  const osID = settings[VMSettingsField.OPERATING_SYSTEM];
  const osName = (operatingSystems.find(({ id }) => id === osID) || {}).name;

  entity.addAnotation(`${TEMPLATE_OS_NAME_ANNOTATION}/${osID}`, osName);

  if (settings[VMSettingsField.DESCRIPTION]) {
    entity.addAnotation(ANNOTATION_DESCRIPTION, settings[VMSettingsField.DESCRIPTION]);
  }

  entity.addLabel(`${TEMPLATE_OS_LABEL}/${osID}`, 'true');
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
  { vmSettings }: CreateVMEnhancedParams,
  entity: MutableVMWrapper,
) => {
  const name = getFieldValue(vmSettings, VMSettingsField.NAME);

  entity.addTemplateLabel(TEMPLATE_VM_NAME_LABEL, name); // for pairing service-vm (like for RDP)

  if (!entity.hasTemplateLabel(TEMPLATE_VM_DOMAIN_LABEL)) {
    entity.addTemplateLabel(TEMPLATE_VM_DOMAIN_LABEL, name);
  }

  if (!entity.hasLabel(APP)) {
    entity.addLabel(APP, name);
  }
};
