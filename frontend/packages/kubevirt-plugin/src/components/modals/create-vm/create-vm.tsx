import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { Form, TextInput, Checkbox, Grid, GridItem, Alert } from '@patternfly/react-core';
import {
  ModalComponentProps,
  ModalTitle,
  ModalBody,
  createModalLauncher,
} from '@console/internal/components/factory';
import { TemplateKind, k8sCreate } from '@console/internal/module/k8s';
import { ValidationObject, FLAGS, alignWithDNS1123 } from '@console/shared';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { history, LoadingBox, useAccessReview2 } from '@console/internal/components/utils';
import { VMKind } from '../../../types';
import { VIRTUAL_MACHINE_EXISTS } from '../../../utils/validations/strings';
import { validateVmLikeEntityName } from '../../../utils/validations';
import { ModalFooter } from '../modal/modal-footer';
import { getVMWizardCreateLink } from '../../../utils/url';
import { DataVolumeModel, VirtualMachineModel } from '../../../models';
import { VMWizardName, VMWizardMode, TEMPLATE_PARAM_VM_NAME, VolumeType } from '../../../constants';
import { VMTemplateWrapper } from '../../../k8s/wrapper/vm/vm-template-wrapper';
import { VMWrapper } from '../../../k8s/wrapper/vm/vm-wrapper';
import { selectVM, getTemplateName } from '../../../selectors/vm-template/basic';
import { VolumeWrapper } from '../../../k8s/wrapper/vm/volume-wrapper';
import { DiskWrapper } from '../../../k8s/wrapper/vm/disk-wrapper';
import { ProcessedTemplatesModel } from '../../../models/models';
import {
  getTemplateWorkloadProfiles,
  getTemplateSizeRequirement,
  getTemplateMemory,
  getTemplateFlavors,
  getTemplateOperatingSystems,
} from '../../../selectors/vm-template/advanced';
import { SuccessResultsComponent } from '../../create-vm-wizard/tabs/result-tab/success-results';
import { getCPU, vCPUCount } from '../../../selectors/vm';
import { FormRow } from '../../form/form-row';

import './create-vm.scss';
import { useFlag } from '@console/shared/src/hooks/flag';
import ProjectDropdown from '../../form/ProjectDropdown';
import { helpResolver } from '../../create-vm-wizard/strings/renderable-field';
import { VMSettingsField } from '../../create-vm-wizard/types';
import {
  initializeCommonMetadata,
  initializeCommonVMMetadata,
} from '../../../k8s/requests/vm/create/common';
import { TemplateSourceStatusBundle } from '../../../statuses/template/types';

type createVM = {
  template: TemplateKind;
  namespace: string;
  name: string;
  sourceStatus: TemplateSourceStatusBundle;
  startVM: boolean;
};

const createVM = async ({ template, namespace, name, sourceStatus, startVM }: createVM) => {
  const templateWrapper = new VMTemplateWrapper(template);
  templateWrapper
    .setNamespace(namespace)
    .setParameter(TEMPLATE_PARAM_VM_NAME, name)
    .unrequireParameters(
      new Set(
        templateWrapper
          .getParameters()
          .map((p) => p.name)
          .filter((n) => n !== TEMPLATE_PARAM_VM_NAME),
      ),
    );
  const processedTemplate = await k8sCreate(ProcessedTemplatesModel, templateWrapper.asResource());
  const vmWrapper = new VMWrapper(selectVM(processedTemplate))
    .setNamespace(namespace)
    .setHostname(name);

  if (sourceStatus.pvc) {
    const rootVolume = new VolumeWrapper();
    rootVolume.init({ name: 'rootdisk' }).setType(VolumeType.DATA_VOLUME, {
      name: `${name}-rootdisk`,
    });

    const rootDisk = new DiskWrapper(
      vmWrapper.getDisks().find((d) => d.name === 'rootdisk'),
      true,
    );

    const { accessModes, resources, storageClassName, volumeMode } = sourceStatus.pvc.spec;

    const rootDataVolume = {
      apiVersion: 'cdi.kubevirt.io/v1alpha1',
      kind: 'DataVolume',
      metadata: {
        name: `${name}-rootdisk`,
        namespace,
      },
      spec: {
        pvc: {
          accessModes,
          resources,
          storageClassName,
          volumeMode,
        },
        source: {
          pvc: {
            name: sourceStatus.pvc.metadata.name,
            namespace: sourceStatus.pvc.metadata.namespace,
          },
        },
      },
    };

    vmWrapper.removeStorage('rootdisk');
    vmWrapper.prependStorage({
      disk: rootDisk.asResource(),
      volume: rootVolume.asResource(),
      dataVolume: rootDataVolume,
    });
  }

  const settings = {
    [VMSettingsField.NAME]: name,
    [VMSettingsField.DESCRIPTION]: null,
    [VMSettingsField.FLAVOR]: getTemplateFlavors([template])[0],
    [VMSettingsField.WORKLOAD_PROFILE]: getTemplateWorkloadProfiles([template])[0],
    osID: getTemplateOperatingSystems([template])[0].id,
    osName: getTemplateOperatingSystems([template])[0].name,
  };

  initializeCommonMetadata(settings, vmWrapper, template);
  initializeCommonVMMetadata(settings, vmWrapper);

  const res = vmWrapper.asResource();
  res.spec.running = startVM;

  return k8sCreate(VirtualMachineModel, res);
};

const generateName = (template: TemplateKind, user): string => {
  return alignWithDNS1123(
    `${template.metadata.name}-${user?.fullName ?? user?.metadata?.name}-${Date.now()}`,
  );
};

const CreateVMModal: React.FC<CreateVMModalProps> = ({ close, cancel, sourceStatus, template }) => {
  const [isCreated, setCreated] = React.useState(false);
  const [isSubmitting, setSubmitting] = React.useState(false);
  const useProjects = useFlag(FLAGS.OPENSHIFT);
  const user = useSelector(({ UI }) => UI.get('user'));
  const [name, setName] = React.useState<string>();
  const [nameValidation, setNameValidation] = React.useState<ValidationObject>();
  const [namespace, setNamespace] = React.useState<string>();
  const [vms, loaded] = useK8sWatchResource<VMKind[]>({
    kind: VirtualMachineModel.kind,
    namespace,
    isList: true,
  });
  const [startVM, setStartVM] = React.useState(true);
  const [createError, setCreateError] = React.useState<string>();

  const [cloneAllowed, cloneAllowedLoading] = useAccessReview2({
    group: DataVolumeModel.apiGroup,
    resource: DataVolumeModel.plural,
    subresource: 'source',
    verb: 'create',
    namespace,
  });

  const onNameChange = (value: string) => {
    setName(value);
    const v = validateVmLikeEntityName(value, namespace, vms, {
      existsErrorMessage: VIRTUAL_MACHINE_EXISTS,
      subject: 'Name',
    });
    setNameValidation(v);
  };

  React.useEffect(() => {
    if (loaded && namespace && !name) {
      const initName = generateName(template, user);
      onNameChange(initName);
    }
    // eslint-disable-next-line
  }, [loaded, namespace]);

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

  return (
    <div className="modal-content modal-content--no-inner-scroll">
      {isCreated ? (
        <SuccessResultsComponent name={name} namespace={namespace} onClick={close} />
      ) : (
        <>
          <ModalTitle>Create Virtual Machine from template</ModalTitle>
          <ModalBody>
            <p>
              You are creating a virtual machine from the <b>{getTemplateName(template)}</b>{' '}
              template. You can also customize this virtual machine before you create it.
            </p>
            <Form>
              <FormRow
                fieldId="vm-namespace"
                title={useProjects ? 'Project' : 'Namespace'}
                isRequired
              >
                <ProjectDropdown onChange={setNamespace} project={namespace} />
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
              <Grid hasGutter>
                <GridItem span={4} className="kubevirt-create-vm-desc">
                  <FormRow
                    fieldId="vm-flavor"
                    title="Flavor"
                    help={helpResolver[VMSettingsField.FLAVOR]()}
                  >
                    {`${vCPUCount(getCPU(selectVM(template)))} CPU, ${getTemplateMemory(
                      template,
                    )} Memory`}
                  </FormRow>
                </GridItem>
                <GridItem span={4} className="kubevirt-create-vm-desc">
                  <FormRow fieldId="vm-storage" title="Storage">
                    {getTemplateSizeRequirement(template, sourceStatus)}
                  </FormRow>
                </GridItem>
                <GridItem span={4}>
                  <FormRow
                    fieldId="vm-workload"
                    title="Workload profile"
                    help={helpResolver[VMSettingsField.WORKLOAD_PROFILE]()}
                  >
                    {getTemplateWorkloadProfiles([template])[0]}
                  </FormRow>
                </GridItem>
              </Grid>
              <FormRow fieldId="start-vm">
                <Checkbox
                  isChecked={startVM}
                  onChange={setStartVM}
                  label="Start this virtual machine after creation"
                  id="start-vm"
                />
              </FormRow>
            </Form>
          </ModalBody>
          <ModalFooter
            submitButtonText="Create virtual machine"
            saveAndRestartText="Customize virtual machine"
            isSaveAndRestart
            isDisabled={!name || !namespace || isSubmitting}
            errorMessage={createError}
            onSubmit={async () => {
              try {
                setSubmitting(true);
                await createVM({ template, name, sourceStatus, startVM, namespace });
                setCreated(true);
              } catch (err) {
                setCreateError(err.message);
              } finally {
                setSubmitting(false);
              }
            }}
            onSaveAndRestart={() => {
              close();
              history.push(
                getVMWizardCreateLink({
                  namespace,
                  wizardName: VMWizardName.WIZARD,
                  mode: VMWizardMode.VM,
                  template,
                  name,
                }),
              );
            }}
            onCancel={cancel}
          />
        </>
      )}
    </div>
  );
};

type CreateVMModalProps = ModalComponentProps & {
  template: TemplateKind;
  sourceStatus: TemplateSourceStatusBundle;
};

export const createVMModal = createModalLauncher(CreateVMModal);
