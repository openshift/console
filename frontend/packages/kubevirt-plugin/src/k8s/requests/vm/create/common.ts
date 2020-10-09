import { TemplateKind } from '@console/internal/module/k8s';
import { getName, getNamespace, getAnnotations } from '@console/shared/src';
import { VMSettingsField } from '../../../../components/create-vm-wizard/types';
import {
  ANNOTATION_DESCRIPTION,
  ANNOTATION_USER_PROVIDER,
  APP,
  ANNOTATION_VALIDATIONS,
  LABEL_USED_TEMPLATE_NAME,
  LABEL_USED_TEMPLATE_NAMESPACE,
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_OS_NAME_ANNOTATION,
  TEMPLATE_VM_DOMAIN_LABEL,
  TEMPLATE_VM_NAME_LABEL,
  TEMPLATE_WORKLOAD_LABEL,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_TYPE_VM,
  ANNOTATION_ICON,
} from '../../../../constants/vm';
import { VMWrapper } from '../../../wrapper/vm/vm-wrapper';
import { VMTemplateWrapper } from '../../../wrapper/vm/vm-template-wrapper';
import { isCustomFlavor } from '../../../../selectors/vm-like/flavor';

export const initializeCommonMetadata = (
  settings: {
    [VMSettingsField.DESCRIPTION]: string;
    [VMSettingsField.FLAVOR]: string;
    [VMSettingsField.WORKLOAD_PROFILE]: string;
    [VMSettingsField.TEMPLATE_PROVIDER]: string;
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

  if (settings[VMSettingsField.TEMPLATE_PROVIDER]) {
    entity.addAnotation(ANNOTATION_USER_PROVIDER, settings[VMSettingsField.TEMPLATE_PROVIDER]);
  }

  entity.addLabel(`${TEMPLATE_OS_LABEL}/${settings.osID}`, 'true');

  if (!isCustomFlavor(settings[VMSettingsField.FLAVOR])) {
    entity.addLabel(`${TEMPLATE_FLAVOR_LABEL}/${settings[VMSettingsField.FLAVOR]}`, 'true');
  }

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

  if (!isCustomFlavor(settings[VMSettingsField.FLAVOR])) {
    entity.addTemplateLabel(`${TEMPLATE_FLAVOR_LABEL}/${settings[VMSettingsField.FLAVOR]}`, 'true');
  }

  if (settings[VMSettingsField.WORKLOAD_PROFILE]) {
    entity.addTemplateLabel(
      `${TEMPLATE_WORKLOAD_LABEL}/${settings[VMSettingsField.WORKLOAD_PROFILE]}`,
      'true',
    );
  }
};

export const initializeCommonTemplateMetadata = (
  entity: VMTemplateWrapper,
  template?: TemplateKind,
) => {
  const annotations = getAnnotations(template);

  const validations = annotations?.[ANNOTATION_VALIDATIONS];

  entity.addLabel(TEMPLATE_TYPE_LABEL, TEMPLATE_TYPE_VM);
  validations && entity.addAnotation(ANNOTATION_VALIDATIONS, validations);

  const iconClass = annotations?.[ANNOTATION_ICON];
  iconClass && entity.addAnotation(ANNOTATION_ICON, iconClass);
};
