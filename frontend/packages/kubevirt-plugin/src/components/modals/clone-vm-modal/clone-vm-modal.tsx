import * as React from 'react';
import * as classNames from 'classnames';
import { getResource } from 'kubevirt-web-ui-components';
import { connect } from 'react-redux';
import {
  Form,
  FormGroup,
  TextArea,
  TextInput,
  Checkbox,
  FormSelect,
  FormSelectOption,
  Alert,
} from '@patternfly/react-core';
import {
  Firehose,
  FirehoseResult,
  HandlePromiseProps,
  withHandlePromise,
} from '@console/internal/components/utils';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalComponentProps,
  ModalFooter,
} from '@console/internal/components/factory';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { NamespaceModel, PersistentVolumeClaimModel, ProjectModel } from '@console/internal/models';
import { getName, getNamespace } from '@console/shared';
import { VMKind } from '../../../types';
import { getDescription } from '../../../selectors/selectors';
import { getLoadedData, getLoadError, prefixedID } from '../../../utils';
import { DataVolumeModel, VirtualMachineModel } from '../../../models';
import { cloneVM } from '../../../k8s/requests/vm/clone';
import { validateVmName } from '../../../utils/validations/vm';
import {
  getVolumeDataVolumeName,
  getVolumePersistentVolumeClaimName,
  getVolumes,
  isVMRunning,
} from '../../../selectors/vm';
import { ValidationErrorType } from '../../../utils/validations/common';
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

  const nameError = validateVmName(name, namespace, getLoadedData(virtualMachines, []));

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
    handlePromise(promise).then(close); // eslint-disable-line promise/catch-or-return
  };

  const onCancelClick = (e) => {
    e.stopPropagation();
    cancel(e);
  };

  return (
    <div className="modal-content">
      <ModalTitle>Clone Virtual Machine</ModalTitle>
      <ModalBody>
        {[
          { error: namespacesError, key: 'namespacesError' },
          { error: pvcsError, key: 'pvcsError' },
          { error: dataVolumesError, key: 'dataVolumesError' },
        ]
          .filter((e) => e.error)
          .map(({ error, key }, idx, arr) => (
            <Alert
              key={key}
              variant="danger"
              title="Could not load data"
              className={classNames({
                'kubevirt-clone-vm-modal__error-group--item': idx !== arr.length - 1,
                'kubevirt-clone-vm-modal__error-group--end ': idx === arr.length - 1,
              })}
            >
              {error}
            </Alert>
          ))}
        {isVMRunning(vm) && (
          <Alert
            variant="warning"
            title={`The VM ${getName(vm)} is still running. It will be powered off while cloning.`}
            className="kubevirt-clone-vm-modal__error-group--end "
          />
        )}
        <Form isHorizontal>
          <FormGroup
            label="Name"
            isRequired
            fieldId={asId('name')}
            isValid={!(nameError && nameError.type === ValidationErrorType.Error)}
            helperTextInvalid={nameError && nameError.message}
          >
            <TextInput
              isValid={!(nameError && nameError.type === ValidationErrorType.Error)}
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
              {getLoadedData(namespaces, []).map((n) => {
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
      <ModalFooter inProgress={inProgress} errorMessage={errorMessage}>
        <button type="button" onClick={onCancelClick} className="btn btn-default">
          Cancel
        </button>
        <button
          type="button"
          disabled={!isValid}
          onClick={submit}
          className="btn btn-primary"
          id="confirm-action"
        >
          Clone Virtual Machine
        </button>
      </ModalFooter>
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
  const [namespace, setNamespace] = React.useState(getNamespace(vm));

  const requestsDataVolumes = !!getVolumes(vm).find(getVolumeDataVolumeName);
  const requestsPVCs = !!getVolumes(vm).find(getVolumePersistentVolumeClaimName);

  const resources = [
    getResource(useProjects ? ProjectModel : NamespaceModel, { prop: 'namespaces' }),
    getResource(VirtualMachineModel, { namespace, prop: 'virtualMachines' }),
  ];

  if (requestsPVCs) {
    resources.push(
      getResource(PersistentVolumeClaimModel, { namespace, prop: 'persistentVolumeClaims' }),
    );
  }

  if (requestsDataVolumes) {
    resources.push(getResource(DataVolumeModel, { namespace, prop: 'dataVolumes' }));
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
