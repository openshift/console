import * as React from 'react';
import { connect } from 'react-redux';
import {
  Form,
  FormGroup,
  TextArea,
  TextInput,
  Checkbox,
  FormSelect,
  FormSelectOption,
} from '@patternfly/react-core';
import {
  Firehose,
  FirehoseResource,
  FirehoseResult,
  HandlePromiseProps,
  withHandlePromise,
} from '@console/internal/components/utils';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalComponentProps,
} from '@console/internal/components/factory';
import { ModalFooter } from '../modal/modal-footer';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { NamespaceModel, PersistentVolumeClaimModel, ProjectModel } from '@console/internal/models';
import { getName, getNamespace, ValidationErrorType } from '@console/shared';
import { VMKind } from '../../../types';
import { getDescription } from '../../../selectors/selectors';
import { getLoadedData, getLoadError, prefixedID } from '../../../utils';
import { DataVolumeModel, VirtualMachineModel } from '../../../models';
import { cloneVM } from '../../../k8s/requests/vm/clone';
import { validateVmLikeEntityName } from '../../../utils/validations/vm';
import {
  getVolumeDataVolumeName,
  getVolumePersistentVolumeClaimName,
  getVolumes,
  isVMExpectedRunning,
} from '../../../selectors/vm';
import { VIRTUAL_MACHINE_EXISTS } from '../../../utils/validations/strings';
import { Errors } from '../../errors/errors';
import { COULD_NOT_LOAD_DATA } from '../../../utils/strings';
import { ConfigurationSummary } from './configuration-summary';

import './_clone-vm-modal.scss';

export const CloneVMModal = withHandlePromise((props: CloneVMModalProps) => {
  const {
    vm,
    namespace,
    onNamespaceChanged,
    namespaces,
    virtualMachines,
    persistentVolumeClaims,
    dataVolumes,
    requestsDataVolumes,
    requestsPVCs,
    inProgress,
    errorMessage,
    handlePromise,
    close,
    cancel,
  } = props;
  const asId = prefixedID.bind(null, 'clone-dialog-vm');

  const [name, setName] = React.useState(`${getName(vm)}-clone`);
  const [description, setDescription] = React.useState(getDescription(vm));
  const [startVM, setStartVM] = React.useState(false);

  const namespacesError = getLoadError(namespaces, NamespaceModel);
  const pvcsError = requestsPVCs
    ? getLoadError(persistentVolumeClaims, PersistentVolumeClaimModel)
    : null;
  const dataVolumesError = requestsDataVolumes ? getLoadError(dataVolumes, DataVolumeModel) : null;

  const persistentVolumeClaimsData = getLoadedData(persistentVolumeClaims, []);
  const dataVolumesData = getLoadedData(dataVolumes, []);

  const nameError = validateVmLikeEntityName(name, namespace, getLoadedData(virtualMachines, []), {
    existsErrorMessage: VIRTUAL_MACHINE_EXISTS,
    subject: 'Name',
  });

  const dataVolumesValid = !(dataVolumesError || (requestsDataVolumes && !dataVolumes.loaded));
  const pvcsValid = !(pvcsError || (requestsPVCs && !persistentVolumeClaims.loaded));

  const isValid =
    !nameError && dataVolumesValid && pvcsValid && !namespacesError && name && namespace;

  const submit = (e) => {
    e.preventDefault();

    const promise = cloneVM(
      {
        vm,
        dataVolumes: dataVolumesData,
        persistentVolumeClaims: persistentVolumeClaimsData,
      },
      { name, namespace, description, startVM },
    );
    handlePromise(promise, close);
  };

  const onCancelClick = (e) => {
    e.stopPropagation();
    cancel();
  };

  const vmRunningWarning =
    isVMExpectedRunning(vm) &&
    `The VM ${getName(vm)} is still running. It will be powered off while cloning.`;

  return (
    <div className="modal-content">
      <ModalTitle>Clone Virtual Machine</ModalTitle>
      <ModalBody>
        <Errors
          endMargin
          errors={[
            {
              key: 'namespacesError',
              message: namespacesError,
              title: COULD_NOT_LOAD_DATA,
            },
            {
              key: 'pvcsError',
              message: pvcsError,
              title: COULD_NOT_LOAD_DATA,
            },
            {
              key: 'dataVolumesError',
              message: dataVolumesError,
              title: COULD_NOT_LOAD_DATA,
            },
          ].filter((err) => err.message)}
        />
        <Form isHorizontal>
          <FormGroup
            label="Name"
            isRequired
            fieldId={asId('name')}
            validated={
              !(nameError && nameError.type === ValidationErrorType.Error) ? 'default' : 'error'
            }
            helperTextInvalid={nameError && nameError.message}
          >
            <TextInput
              validated={
                !(nameError && nameError.type === ValidationErrorType.Error) ? 'default' : 'error'
              }
              isRequired
              type="text"
              id={asId('name')}
              value={name}
              onChange={(v) => setName(v)}
              aria-label="new VM name"
            />
          </FormGroup>
          <FormGroup label="Description" fieldId={asId('description')}>
            <TextArea
              id={asId('description')}
              value={description}
              onChange={(v) => setDescription(v)}
              className="kubevirt-clone-vm-modal__description"
            />
          </FormGroup>
          <FormGroup isRequired label="Namespace" fieldId={asId('namespace')}>
            <FormSelect
              value={namespace}
              onChange={(v) => onNamespaceChanged(v)}
              id={asId('namespace')}
            >
              {[...getLoadedData(namespaces, [])]
                .sort((n1, n2) => {
                  const n1Name = getName(n1);
                  const n2Name = getName(n2);
                  return n1Name.localeCompare(n2Name);
                })
                .map((n) => {
                  const namespaceName = getName(n);
                  return (
                    <FormSelectOption
                      key={namespaceName}
                      value={namespaceName}
                      label={namespaceName}
                    />
                  );
                })}
            </FormSelect>
          </FormGroup>
          <FormGroup fieldId={asId('start')}>
            <Checkbox
              label="Start virtual machine on clone"
              id={asId('start')}
              isChecked={startVM}
              onChange={setStartVM}
              className="kubevirt-clone-vm-modal__start_vm_checkbox"
            />
          </FormGroup>
          <FormGroup label="Configuration" fieldId={asId('configuration-summary')}>
            <ConfigurationSummary
              id={asId('configuration-summary')}
              vm={vm}
              persistentVolumeClaims={persistentVolumeClaimsData}
              dataVolumes={dataVolumesData}
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter
        id="clone-vm"
        errorMessage={errorMessage}
        isSimpleError={!!vmRunningWarning && !errorMessage}
        warningMessage={vmRunningWarning}
        inProgress={inProgress}
        isDisabled={!isValid || inProgress}
        submitButtonText="Clone Virtual Machine"
        onSubmit={submit}
        onCancel={onCancelClick}
      />
    </div>
  );
});

export type CloneVMModalProps = CloneVMModalFirehoseProps &
  HandlePromiseProps & {
    namespace: string;
    onNamespaceChanged: (namespace: string) => void;
    namespaces?: FirehoseResult<K8sResourceKind[]>;
    virtualMachines?: FirehoseResult<VMKind[]>;
    dataVolumes?: FirehoseResult<K8sResourceKind[]>;
    persistentVolumeClaims?: FirehoseResult<K8sResourceKind[]>;
    requestsDataVolumes: boolean;
    requestsPVCs: boolean;
  };

const CloneVMModalFirehose: React.FC<CloneVMModalFirehoseProps> = (props) => {
  const { vm, useProjects } = props;
  const vmNamespace = getNamespace(vm);
  const [namespace, setNamespace] = React.useState(vmNamespace);

  const requestsDataVolumes = !!getVolumes(vm).find(getVolumeDataVolumeName);
  const requestsPVCs = !!getVolumes(vm).find(getVolumePersistentVolumeClaimName);

  const resources: FirehoseResource[] = [
    {
      kind: (useProjects ? ProjectModel : NamespaceModel).kind,
      isList: true,
      prop: 'namespaces',
    },
    {
      kind: VirtualMachineModel.kind,
      namespace,
      isList: true,
      prop: 'virtualMachines',
    },
  ];

  if (requestsPVCs) {
    resources.push({
      kind: PersistentVolumeClaimModel.kind,
      namespace: vmNamespace,
      isList: true,
      prop: 'persistentVolumeClaims',
    });
  }

  if (requestsDataVolumes) {
    resources.push({
      kind: DataVolumeModel.kind,
      namespace: vmNamespace,
      isList: true,
      prop: 'dataVolumes',
    });
  }

  return (
    <Firehose resources={resources}>
      <CloneVMModal
        {...props}
        namespace={namespace}
        onNamespaceChanged={(n) => setNamespace(n)}
        requestsDataVolumes={requestsDataVolumes}
        requestsPVCs={requestsPVCs}
      />
    </Firehose>
  );
};

type CloneVMModalFirehoseProps = ModalComponentProps & {
  vm: VMKind;
  useProjects: boolean;
};

const cloneVMModalStateToProps = ({ k8s }) => {
  const useProjects = k8s.hasIn(['RESOURCES', 'models', ProjectModel.kind]);
  return {
    useProjects,
  };
};

const CloneVMModalConnected = connect(cloneVMModalStateToProps)(CloneVMModalFirehose);

export const cloneVMModal = createModalLauncher(CloneVMModalConnected);
