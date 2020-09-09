import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import {
  ModalComponentProps,
  ModalTitle,
  ModalBody,
  createModalLauncher,
} from '@console/internal/components/factory';
import {
  TemplateKind,
  PersistentVolumeClaimKind,
  K8sResourceCommon,
  k8sCreate,
} from '@console/internal/module/k8s';
import {
  K8sEntityMap,
  ALL_NAMESPACES_KEY,
  ValidationObject,
  ValidationErrorType,
} from '@console/shared';
import { getActiveNamespace } from '@console/internal/actions/ui';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ProjectModel } from '@console/internal/models';
import { VMKind } from '../../../types';
import {
  FormGroup,
  Form,
  FormSelect,
  ValidatedOptions,
  FormSelectOption,
  TextInput,
  Checkbox,
} from '@patternfly/react-core';
import { VIRTUAL_MACHINE_EXISTS } from '../../../utils/validations/strings';
import { validateVmLikeEntityName } from '../../../utils/validations';
import { ModalFooter } from '../modal/modal-footer';
import { getVMWizardCreateLink } from '../../../utils/url';
import { VirtualMachineModel } from '../../../models';
import { history } from '@console/internal/components/utils';
import { VMWizardName, VMWizardMode, TEMPLATE_PARAM_VM_NAME, VolumeType } from '../../../constants';
import { VMTemplateWrapper } from '../../../k8s/wrapper/vm/vm-template-wrapper';
import { VMWrapper } from '../../../k8s/wrapper/vm/vm-wrapper';
import { selectVM } from '../../../selectors/vm-template/basic';
import { VolumeWrapper } from '../../../k8s/wrapper/vm/volume-wrapper';
import { DiskWrapper } from '../../../k8s/wrapper/vm/disk-wrapper';
import { ProcessedTemplatesModel } from '../../../models/models';
import {
  getTemplateFlavors,
  getTemplateOperatingSystems,
} from '../../../selectors/vm-template/advanced';

type CreateVMModalProps = ModalComponentProps & {
  templateName: string;
  templates: TemplateKind[];
  baseImageLookup: K8sEntityMap<PersistentVolumeClaimKind>;
};

const CreateVMModal: React.FC<CreateVMModalProps> = ({
  cancel,
  close,
  templates,
  templateName,
  baseImageLookup,
}) => {
  const activeNamespace = useSelector(getActiveNamespace);
  const [namespaces, loaded, error] = useK8sWatchResource<K8sResourceCommon[]>(
    activeNamespace === ALL_NAMESPACES_KEY
      ? {
          kind: ProjectModel.kind,
          isList: true,
        }
      : undefined,
  );
  const [name, setName] = React.useState<string>();
  const [nameValidation, setNameValidation] = React.useState<ValidationObject>();
  const [namespace, setNamespace] = React.useState<string>(
    activeNamespace === ALL_NAMESPACES_KEY ? 'default' : activeNamespace,
  );
  const [vms] = useK8sWatchResource<VMKind[]>({
    kind: VirtualMachineModel.kind,
    namespace,
    isList: true,
  });
  const [startVM, setStartVM] = React.useState(true);
  const flavors = getTemplateFlavors(templates);
  const [flavor, setFlavor] = React.useState(flavors[0]);
  return (
    <div className="modal-content">
      <ModalTitle>Create Virtual Machine from template</ModalTitle>
      <ModalBody>
        <p>
          You are creating a virtual machine from the {templateName} template. You can also
          customize this virtual machine before you create it.
        </p>
        <Form>
          <FormGroup
            fieldId="simple-form-name"
            label="Virtual Machine Name"
            isRequired
            validated={
              nameValidation?.type !== ValidationErrorType.Error
                ? ValidatedOptions.default
                : ValidatedOptions.error
            }
            helperTextInvalid={
              nameValidation?.type === ValidationErrorType.Error
                ? nameValidation.message
                : undefined
            }
          >
            <TextInput
              isRequired
              type="text"
              id="simple-form-name"
              name="simple-form-name"
              aria-describedby="simple-form-name-helper"
              value={name}
              onChange={(value) => {
                setName(value);
                const v = validateVmLikeEntityName(value, namespace, vms, {
                  existsErrorMessage: VIRTUAL_MACHINE_EXISTS,
                  subject: 'Name',
                });
                setNameValidation(v);
              }}
            />
          </FormGroup>
          {activeNamespace === ALL_NAMESPACES_KEY && (
            <FormGroup
              fieldId="simple-form-namespace"
              label="Namespace"
              isRequired
              validated={error ? ValidatedOptions.error : ValidatedOptions.default}
              helperTextInvalid="Cannot load namespaces"
            >
              {loaded ? (
                <FormSelect
                  value={namespace}
                  onChange={setNamespace}
                  id="horzontal-form-title"
                  name="horizontal-form-title"
                  aria-label="Your title"
                >
                  {namespaces.map((ns) => (
                    <FormSelectOption
                      key={ns.metadata.uid}
                      value={ns.metadata.name}
                      label={ns.metadata.name}
                    />
                  ))}
                </FormSelect>
              ) : (
                <div>loading ns</div>
              )}
            </FormGroup>
          )}
          <FormGroup fieldId="simple-form-flavor" label="Flavor">
            <FormSelect
              value={flavor}
              onChange={setFlavor}
              id="horzontal-form-flavor"
              name="horizontal-form-flavor"
              aria-label="Your title"
            >
              {flavors.map((f) => (
                <FormSelectOption key={f} value={f} label={f} />
              ))}
            </FormSelect>
          </FormGroup>
          <FormGroup fieldId="start-vm">
            <Checkbox
              isChecked={startVM}
              onChange={setStartVM}
              label="Start this virtual machine after creation"
              id="start-vm"
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter
        submitButtonText="Create virtual machine"
        saveAndRestartText="Customize virtual machine"
        isSaveAndRestart
        isDisabled={!name}
        onSubmit={async () => {
          const templateWrapper = new VMTemplateWrapper(templates[0]);
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
          const processedTemplate = await k8sCreate(
            ProcessedTemplatesModel,
            templateWrapper.asResource(),
          ); // temporary
          const vmWrapper = new VMWrapper(selectVM(processedTemplate)).setNamespace(namespace);

          const osName = getTemplateOperatingSystems([templates[0]])[0].id;
          const baseImage = baseImageLookup[osName];

          const rootVolume = new VolumeWrapper();
          rootVolume.init({ name: 'rootdisk' }).setType(VolumeType.DATA_VOLUME, {
            name: `${name}-rootdisk`,
          });

          const rootDisk = new DiskWrapper(
            vmWrapper.getDisks().find((d) => d.name === 'rootdisk'),
            true,
          );

          const rootDataVolume = {
            apiVersion: 'cdi.kubevirt.io/v1alpha1',
            kind: 'DataVolume',
            metadata: {
              name: `${name}-rootdisk`,
              namespace,
            },
            spec: {
              pvc: baseImage.spec,
              source: {
                pvc: {
                  name: baseImage.metadata.name,
                  namespace: baseImage.metadata.namespace,
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

          /*
          const rootdisk = vmWrapper.getVolumes().find((v) => v.name === 'rootdisk');
          rootdisk.dataVolume = {
            name: `${name}-rootdisk`,
          };
          delete rootdisk.persistentVolumeClaim;
          // const dvTemplates = vmWrapper.getDataVolumeTemplates();
          vmWrapper.asResource().spec.dataVolumeTemplates = [
            {
              apiVersion: 'cdi.kubevirt.io/v1alpha1',
              kind: 'DataVolume',
              metadata: {
                name: `${name}-rootdisk`,
                namespace,
              },
              spec: {
                pvc: dataVolume.spec.pvc,
                source: {
                  pvc: {
                    name: dataVolume.metadata.name,
                    namespace: dataVolume.metadata.namespace,
                  },
                },
              },
            },
          ];
          */

          const res = vmWrapper.asResource();
          res.spec.running = startVM;

          await k8sCreate(VirtualMachineModel, res); // temporary
          close();
        }}
        onSaveAndRestart={() => {
          close();
          const template = templates.find((t) => getTemplateFlavors([t])[0] === flavor);
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
    </div>
  );
};

export const createVMModal = createModalLauncher(CreateVMModal);
