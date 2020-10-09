import * as React from 'react';
import { uniqueNamesGenerator, animals, adjectives } from 'unique-names-generator';
import {
  Alert,
  Form,
  TextInput,
  Checkbox,
  SelectVariant,
  SelectOption,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Button,
  ButtonVariant,
  ExpandableSection,
} from '@patternfly/react-core';
import {
  convertToBaseValue,
  LoadingBox,
  useAccessReview2,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { alignWithDNS1123, BlueInfoCircleIcon, FLAGS } from '@console/shared';
import { useFlag } from '@console/shared/src/hooks/flag';
import { TemplateKind } from '@console/internal/module/k8s';

import { DataVolumeModel, VirtualMachineModel } from '../../../models';
import { VMKind } from '../../../types';
import { validateVmLikeEntityName } from '../../../utils/validations';
import { VIRTUAL_MACHINE_EXISTS } from '../../../utils/validations/strings';
import { FormRow } from '../../form/form-row';
import { ProjectDropdown } from '../../form/project-dropdown';
import { getTemplateName, selectVM } from '../../../selectors/vm-template/basic';
import {
  getDefaultDiskBus,
  getTemplateFlavorDesc,
  getTemplateMemory,
  getTemplateSizeRequirement,
} from '../../../selectors/vm-template/advanced';
import { VMSettingsField } from '../../create-vm-wizard/types';
import { helpResolver } from '../../create-vm-wizard/strings/renderable-field';
import { FormAction, FormState, FORM_ACTION_TYPE } from './create-vm-form-reducer';
import { TemplateItem } from '../../../types/template';
import { isTemplateSourceError, TemplateSourceStatus } from '../../../statuses/template/types';
import {
  SourceDescription,
  URLSource,
  ContainerSource,
  PVCSource,
} from '../../vm-templates/vm-template-source';
import { BootSourceState } from './boot-source-form-reducer';
import { ROOT_DISK_INSTALL_NAME } from '../../../constants';
import { getCPU, getWorkloadProfile, vCPUCount } from '../../../selectors/vm';
import { FormPFSelect } from '../../form/form-pf-select';
import { preventDefault } from '../../form/utils';
import { getParameterValue } from '../../../selectors/selectors';
import { DataVolumeSourceType, TEMPLATE_BASE_IMAGE_NAME_PARAMETER } from '../../../constants/vm';

import './create-vm-form.scss';

const generateName = (template: TemplateKind): string =>
  alignWithDNS1123(
    `${getParameterValue(template, TEMPLATE_BASE_IMAGE_NAME_PARAMETER) ||
      getTemplateName(template)}-${uniqueNamesGenerator({
      dictionaries: [adjectives, animals],
      separator: '-',
    })}`,
  );

export type CustomizeLinkProps = {
  onCustomize: VoidFunction;
};

export const CustomizeLink: React.FC<CustomizeLinkProps> = ({ onCustomize }) => (
  <>
    You can also{' '}
    <Button isInline variant={ButtonVariant.link} onClick={onCustomize}>
      customize
    </Button>{' '}
    this virtual machine before you create it.
  </>
);

export type CreateVMFormProps = CustomizeLinkProps & {
  template: TemplateItem;
  sourceStatus: TemplateSourceStatus;
  customSource?: BootSourceState;
  state: FormState;
  dispatch: React.Dispatch<FormAction>;
};

export const CreateVMForm: React.FC<CreateVMFormProps> = ({
  sourceStatus,
  template: selectedTemplate,
  state,
  dispatch,
  customSource,
  onCustomize,
}) => {
  const { name, nameValidation, namespace, startVM, template } = state;
  const useProjects = useFlag(FLAGS.OPENSHIFT);
  const [vms, loaded] = useK8sWatchResource<VMKind[]>({
    kind: VirtualMachineModel.kind,
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

  React.useEffect(() => {
    if (!template) {
      dispatch({ type: FORM_ACTION_TYPE.SET_TEMPLATE, payload: selectedTemplate.variants[0] });
    }
  }, [dispatch, selectedTemplate.variants, template]);

  const onNameChange = (value: string) => {
    const validation = validateVmLikeEntityName(value, namespace, vms, {
      existsErrorMessage: VIRTUAL_MACHINE_EXISTS,
      subject: 'Name',
    });
    dispatch({ type: FORM_ACTION_TYPE.SET_NAME, payload: { value, validation } });
  };

  const onNamespaceChange = (value: string) => {
    const validation = validateVmLikeEntityName(value, namespace, vms, {
      existsErrorMessage: VIRTUAL_MACHINE_EXISTS,
      subject: 'Name',
    });
    dispatch({ type: FORM_ACTION_TYPE.SET_NAMESPACE, payload: { value, validation } });
  };

  React.useEffect(() => {
    if (loaded && namespace && !name && template) {
      const initName = generateName(template);
      onNameChange(initName);
    }
    // eslint-disable-next-line
  }, [loaded]);

  if (cloneAllowedLoading) {
    return <LoadingBox />;
  }

  if (!cloneAllowed && namespace) {
    return (
      <Alert variant="danger" isInline title="Permissions required">
        You do not have permissions to clone base image into this namespace.
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
    .reduce((acc, t) => {
      const flavor = getTemplateFlavorDesc(t);
      acc[flavor] = t;
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
          />
        );
        break;
      default:
        break;
    }
  } else if (!isTemplateSourceError(sourceStatus)) {
    cdRom = sourceStatus.isCDRom;
    source = (
      <SourceDescription sourceStatus={sourceStatus} template={selectedTemplate.variants[0]} />
    );
  }

  return (
    <Stack hasGutter>
      <StackItem>
        <Stack>
          <StackItem>
            You are creating a virtual machine from the <b>{getTemplateName(template)}</b> template.
          </StackItem>
          <StackItem>
            <CustomizeLink onCustomize={onCustomize} />
          </StackItem>
        </Stack>
      </StackItem>
      <StackItem>
        <Form onSubmit={preventDefault}>
          <FormRow fieldId="vm-namespace" title={useProjects ? 'Project' : 'Namespace'} isRequired>
            <ProjectDropdown onChange={onNamespaceChange} project={namespace} />
          </FormRow>
          <FormRow
            fieldId="vm-name"
            title="Virtual Machine Name"
            isRequired
            validation={nameValidation}
            help="The name field is auto generated for quick create."
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
          <FormRow fieldId="vm-flavor" title="Flavor" isRequired>
            <FormPFSelect
              variant={SelectVariant.single}
              selections={[getTemplateFlavorDesc(template)]}
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
              <FormRow fieldId="vm-storage" title="Storage">
                {getTemplateSizeRequirement(template, sourceStatus, customSource)}
              </FormRow>
            </SplitItem>
            <SplitItem>
              <FormRow
                fieldId="vm-workload"
                title="Workload profile"
                help={helpResolver[VMSettingsField.WORKLOAD_PROFILE]()}
              >
                {getWorkloadProfile(template) || 'Not available'}
              </FormRow>
            </SplitItem>
          </Split>
          {source && (
            <FormRow fieldId="boot-source" title="Boot source">
              <Stack hasGutter>
                <StackItem>{source}</StackItem>
                {cdRom && (
                  <StackItem>
                    <Stack>
                      <StackItem>
                        <BlueInfoCircleIcon /> A new disk has been added to support this ISO source.
                        Edit this disk by customizing the virtual machine.
                      </StackItem>
                      <StackItem>
                        <ExpandableSection toggleText="Disk details">
                          {ROOT_DISK_INSTALL_NAME} - Blank - 20GiB -{' '}
                          {getDefaultDiskBus(template).toString()} - default storage class
                        </ExpandableSection>
                      </StackItem>
                    </Stack>
                  </StackItem>
                )}
              </Stack>
            </FormRow>
          )}
          <FormRow fieldId="start-vm">
            <Checkbox
              isChecked={startVM}
              onChange={(value) => dispatch({ type: FORM_ACTION_TYPE.START_VM, payload: value })}
              label="Start this virtual machine after creation"
              id="start-vm"
            />
          </FormRow>
        </Form>
      </StackItem>
    </Stack>
  );
};
