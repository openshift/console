import * as React from 'react';
import {
  Alert,
  Checkbox,
  ExpandableSection,
  Form,
  SelectOption,
  SelectVariant,
  Split,
  SplitItem,
  Stack,
  StackItem,
  TextInput,
} from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import {
  convertToBaseValue,
  humanizeBinaryBytes,
  LoadingBox,
  useAccessReview2,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { BlueInfoCircleIcon, FLAGS, useFlag } from '@console/shared';
import { ROOT_DISK_INSTALL_NAME } from '../../../constants';
import { DataVolumeSourceType, DEFAULT_DISK_SIZE } from '../../../constants/vm';
import { DataVolumeModel, VirtualMachineModel } from '../../../models';
import { kubevirtReferenceForModel } from '../../../models/kubevirtReferenceForModel';
import { getCPU, getWorkloadProfile, vCPUCount } from '../../../selectors/vm';
import {
  getDefaultDiskBus,
  getTemplateFlavorData,
  getTemplateMemory,
  getTemplateSizeRequirementInBytes,
} from '../../../selectors/vm-template/advanced';
import { getTemplateName, selectVM } from '../../../selectors/vm-template/basic';
import { isTemplateSourceError, TemplateSourceStatus } from '../../../statuses/template/types';
import { VMKind } from '../../../types';
import { TemplateItem } from '../../../types/template';
import { generateVMName } from '../../../utils';
import { validateVmLikeEntityName } from '../../../utils/validations';
import { helpKeyResolver } from '../../create-vm-wizard/strings/renderable-field';
import { VMSettingsField } from '../../create-vm-wizard/types';
import { FormPFSelect } from '../../form/form-pf-select';
import { FormRow } from '../../form/form-row';
import { ProjectDropdown } from '../../form/project-dropdown';
import { preventDefault } from '../../form/utils';
import SSHWizard from '../../ssh-service/SSHWizard/SSHWizard';
import {
  ContainerSource,
  PVCSource,
  SourceDescription,
  URLSource,
} from '../../vm-templates/vm-template-source';
import { BootSourceState } from './boot-source-form-reducer';
import { FORM_ACTION_TYPE, FormAction, FormState } from './create-vm-form-reducer';

import './create-vm-form.scss';

export type CreateVMFormProps = {
  template: TemplateItem;
  sourceStatus: TemplateSourceStatus;
  customSource?: BootSourceState;
  state: FormState;
  dispatch: React.Dispatch<FormAction>;
  showCreateInfo?: boolean;
  showProjectDropdown?: boolean;
  cdRomText?: string;
};

export const CreateVMForm: React.FC<CreateVMFormProps> = ({
  sourceStatus,
  template: selectedTemplate,
  state,
  dispatch,
  customSource,
  cdRomText,
  showCreateInfo = true,
  showProjectDropdown = true,
}) => {
  const { t } = useTranslation();
  const { name, nameValidation, namespace, startVM, template } = state;
  const [vms, loaded] = useK8sWatchResource<VMKind[]>({
    kind: kubevirtReferenceForModel(VirtualMachineModel),
    namespace,
    isList: true,
  });

  const [cloneAllowed, cloneAllowedLoading] = useAccessReview2({
    group: DataVolumeModel.apiGroup,
    resource: DataVolumeModel.plural,
    subresource: 'source',
    verb: 'create',
    namespace,
  });

  const useProjects = useFlag(FLAGS.OPENSHIFT);

  React.useEffect(() => {
    if (!template) {
      dispatch({ type: FORM_ACTION_TYPE.SET_TEMPLATE, payload: selectedTemplate.variants[0] });
    }
  }, [dispatch, selectedTemplate.variants, template]);

  const onNameChange = (value: string) => {
    const validation = validateVmLikeEntityName(value, namespace, vms, {
      // t('kubevirt-plugin~Name is already used by another virtual machine in this namespace')
      existsErrorMessage:
        'kubevirt-plugin~Name is already used by another virtual machine in this namespace',
    });
    dispatch({ type: FORM_ACTION_TYPE.SET_NAME, payload: { value, validation } });
  };

  const onNamespaceChange = (value: string) => {
    const validation = validateVmLikeEntityName(value, namespace, vms, {
      // t('kubevirt-plugin~Name is already used by another virtual machine in this namespace')
      existsErrorMessage:
        'kubevirt-plugin~Name is already used by another virtual machine in this namespace',
    });
    dispatch({ type: FORM_ACTION_TYPE.SET_NAMESPACE, payload: { value, validation } });
  };

  React.useEffect(() => {
    if (loaded && namespace && !name && template) {
      const initName = generateVMName(template);
      onNameChange(initName);
    }
    // eslint-disable-next-line
  }, [loaded]);

  if (cloneAllowedLoading) {
    return <LoadingBox />;
  }

  if (!cloneAllowed && namespace) {
    return (
      <Alert variant="danger" isInline title={t('kubevirt-plugin~Permissions required')}>
        {t('kubevirt-plugin~You do not have permissions to clone base image into this namespace.')}
      </Alert>
    );
  }

  if (cloneAllowed !== state.cloneAllowed) {
    dispatch({ type: FORM_ACTION_TYPE.CLONE_ALLOWED, payload: cloneAllowed });
  }

  const flavors = selectedTemplate.variants
    .sort((a, b) => {
      const aCPU = vCPUCount(getCPU(selectVM(a)));
      const bCPU = vCPUCount(getCPU(selectVM(b)));
      if (aCPU === bCPU) {
        const aMemory = convertToBaseValue(getTemplateMemory(a));
        const bMemory = convertToBaseValue(getTemplateMemory(b));
        return aMemory - bMemory;
      }
      return aCPU - bCPU;
    })
    .reduce((acc, tmp) => {
      const flavor = t(
        'kubevirt-plugin~{{flavor}}: {{count}} CPU | {{memory}} Memory',
        getTemplateFlavorData(tmp),
      );
      acc[flavor] = tmp;
      return acc;
    }, {});

  let source: React.ReactNode;
  let cdRom = false;
  if (customSource?.dataSource) {
    cdRom = customSource.cdRom?.value;
    switch (DataVolumeSourceType.fromString(customSource.dataSource?.value)) {
      case DataVolumeSourceType.HTTP:
        source = <URLSource url={customSource.url?.value} isCDRom={cdRom} />;
        break;
      case DataVolumeSourceType.REGISTRY:
        source = <ContainerSource container={customSource.container?.value} isCDRom={cdRom} />;
        break;
      case DataVolumeSourceType.PVC:
        source = (
          <PVCSource
            name={customSource.pvcName?.value}
            namespace={customSource.pvcNamespace?.value}
            isCDRom={cdRom}
            clone
          />
        );
        break;
      default:
        break;
    }
  } else if (!isTemplateSourceError(sourceStatus)) {
    cdRom = sourceStatus?.isCDRom;
    source = (
      <SourceDescription sourceStatus={sourceStatus} template={selectedTemplate.variants[0]} />
    );
  }

  const storage = getTemplateSizeRequirementInBytes(template, sourceStatus, customSource);

  return (
    <Stack hasGutter>
      {showCreateInfo && (
        <StackItem>
          <Trans t={t} ns="kubevirt-plugin">
            You are creating a virtual machine from the <b>{getTemplateName(template)}</b> template.
          </Trans>
        </StackItem>
      )}
      <StackItem>
        <Form onSubmit={preventDefault}>
          {showProjectDropdown && (
            <FormRow
              fieldId="vm-namespace"
              title={useProjects ? t('kubevirt-plugin~Project') : t('kubevirt-plugin~Namespace')}
              isRequired
            >
              <ProjectDropdown
                onChange={onNamespaceChange}
                project={namespace}
                id="project-dropdown"
              />
            </FormRow>
          )}
          <FormRow
            fieldId="vm-name"
            title={t('kubevirt-plugin~Virtual Machine Name')}
            isRequired
            validation={nameValidation}
            help={t('kubevirt-plugin~The name field is auto generated for quick create.')}
          >
            <TextInput
              isRequired
              type="text"
              id="vm-name"
              name="vm-name"
              aria-describedby="vm-name-helper"
              value={name}
              onChange={onNameChange}
              isDisabled={!namespace || !loaded}
            />
          </FormRow>
          <FormRow fieldId="vm-flavor" title={t('kubevirt-plugin~Flavor')} isRequired>
            <FormPFSelect
              toggleId="vm-flavor-select"
              variant={SelectVariant.single}
              selections={[
                t(
                  'kubevirt-plugin~{{flavor}}: {{count}} CPU | {{memory}} Memory',
                  getTemplateFlavorData(template),
                ),
              ]}
              onSelect={(e, f: string) =>
                dispatch({ type: FORM_ACTION_TYPE.SET_TEMPLATE, payload: flavors[f] })
              }
              isCheckboxSelectionBadgeHidden
            >
              {Object.keys(flavors).map((flavor) => (
                <SelectOption key={flavor} value={flavor} />
              ))}
            </FormPFSelect>
          </FormRow>
          <Split hasGutter className="kubevirt-create-vm-desc">
            <SplitItem>
              <FormRow fieldId="vm-storage" title={t('kubevirt-plugin~Storage')}>
                {storage ? humanizeBinaryBytes(storage).string : t('kubevirt-plugin~Not available')}
              </FormRow>
            </SplitItem>
            <SplitItem>
              <FormRow
                fieldId="vm-workload"
                title={t('kubevirt-plugin~Workload profile')}
                help={t(helpKeyResolver[VMSettingsField.WORKLOAD_PROFILE]())}
              >
                {getWorkloadProfile(template) || t('kubevirt-plugin~Not available')}
              </FormRow>
            </SplitItem>
          </Split>
          {source && (
            <FormRow fieldId="boot-source" title={t('kubevirt-plugin~Boot source')}>
              <Stack hasGutter>
                <StackItem>{source}</StackItem>
                {cdRom && (
                  <StackItem>
                    <Stack>
                      <StackItem>
                        <BlueInfoCircleIcon className="co-icon-space-r" />
                        {cdRomText ||
                          t(
                            'kubevirt-plugin~A new disk has been added to support the CD-ROM boot source. Edit this disk by customizing the virtual machine.',
                          )}
                      </StackItem>
                      <StackItem>
                        <ExpandableSection toggleText={t('kubevirt-plugin~Disk details')}>
                          {ROOT_DISK_INSTALL_NAME} - {t('kubevirt-plugin~Blank')} -{' '}
                          {`${DEFAULT_DISK_SIZE}B`} - {t(getDefaultDiskBus(template).toString())} -{' '}
                          {t('kubevirt-plugin~default Storage class')}
                        </ExpandableSection>
                      </StackItem>
                    </Stack>
                  </StackItem>
                )}
              </Stack>
            </FormRow>
          )}
          <FormRow fieldId="ssh-vm">
            <SSHWizard />
          </FormRow>
          <FormRow fieldId="start-vm">
            <Checkbox
              isChecked={startVM}
              onChange={(value) => dispatch({ type: FORM_ACTION_TYPE.START_VM, payload: value })}
              label={t('kubevirt-plugin~Start this virtual machine after creation')}
              id="start-vm"
            />
          </FormRow>
        </Form>
      </StackItem>
    </Stack>
  );
};
