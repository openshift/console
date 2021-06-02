import * as React from 'react';
import {
  Checkbox,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  TextArea,
  TextInput,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalTitle,
} from '@console/internal/components/factory';
import {
  Firehose,
  FirehoseResource,
  FirehoseResult,
  HandlePromiseProps,
  withHandlePromise,
} from '@console/internal/components/utils';
import { NamespaceModel, PersistentVolumeClaimModel, ProjectModel } from '@console/internal/models';
import { K8sResourceKind, PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { getName, getNamespace, ValidationErrorType } from '@console/shared';
import { cloneVM } from '../../../k8s/requests/vm/clone';
import { DataVolumeModel, VirtualMachineModel } from '../../../models';
import { getDescription } from '../../../selectors/selectors';
import {
  getVolumeDataVolumeName,
  getVolumePersistentVolumeClaimName,
  getVolumes,
  isVMExpectedRunning,
} from '../../../selectors/vm';
import { VMKind, VMIKind } from '../../../types';
import { V1alpha1DataVolume } from '../../../types/api';
import { getLoadedData, getLoadError, prefixedID } from '../../../utils';
import { COULD_NOT_LOAD_DATA } from '../../../utils/strings';
import { validateVmLikeEntityName } from '../../../utils/validations/vm';
import { Errors } from '../../errors/errors';
import { ModalFooter } from '../modal/modal-footer';
import { ConfigurationSummary } from './configuration-summary';

import './_clone-vm-modal.scss';

export const CloneVMModal = withHandlePromise<CloneVMModalProps>((props) => {
  const {
    vm,
    vmi,
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
  const { t } = useTranslation();
  const asId = prefixedID.bind(null, 'clone-dialog-vm');

  const [name, setName] = React.useState(`${getName(vm)}-clone`);
  const [description, setDescription] = React.useState(getDescription(vm));
  const [startVM, setStartVM] = React.useState(false);

  const namespacesError = getLoadError(namespaces, NamespaceModel);
  const pvcsError = requestsPVCs
    ? getLoadError(persistentVolumeClaims, PersistentVolumeClaimModel)
    : null;
  const dataVolumesError = requestsDataVolumes ? getLoadError(dataVolumes, DataVolumeModel) : null;

  const persistentVolumeClaimsData = getLoadedData<PersistentVolumeClaimKind[]>(
    persistentVolumeClaims,
    [],
  );
  const dataVolumesData = getLoadedData<V1alpha1DataVolume[]>(dataVolumes, []);

  const nameError = validateVmLikeEntityName(name, namespace, getLoadedData(virtualMachines, []), {
    // t('kubevirt-plugin~Name is already used by another virtual machine in this namespace')
    existsErrorMessage:
      'kubevirt-plugin~Name is already used by another virtual machine in this namespace',
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
        vmi,
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
    isVMExpectedRunning(vm, vmi) &&
    t('kubevirt-plugin~The VM {{vmName}} is still running. It will be powered off while cloning.', {
      vmName: getName(vm),
    });

  return (
    <div className="modal-content">
      <ModalTitle>{t('kubevirt-plugin~Clone Virtual Machine')}</ModalTitle>
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
            label={t('kubevirt-plugin~Name')}
            isRequired
            fieldId={asId('name')}
            validated={!(nameError?.type === ValidationErrorType.Error) ? 'default' : 'error'}
            helperTextInvalid={nameError && t(nameError?.messageKey)}
          >
            <TextInput
              validated={!(nameError?.type === ValidationErrorType.Error) ? 'default' : 'error'}
              isRequired
              type="text"
              id={asId('name')}
              value={name}
              onChange={(v) => setName(v)}
              aria-label={t('kubevirt-plugin~new VM name')}
            />
          </FormGroup>
          <FormGroup label={t('kubevirt-plugin~Description')} fieldId={asId('description')}>
            <TextArea
              id={asId('description')}
              value={description}
              onChange={(v) => setDescription(v)}
              className="kubevirt-clone-vm-modal__description"
            />
          </FormGroup>
          <FormGroup isRequired label={t('kubevirt-plugin~Namespace')} fieldId={asId('namespace')}>
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
              label={t('kubevirt-plugin~Start virtual machine on clone')}
              id={asId('start')}
              isChecked={startVM}
              onChange={setStartVM}
              className="kubevirt-clone-vm-modal__start_vm_checkbox"
            />
          </FormGroup>
          <FormGroup
            label={t('kubevirt-plugin~Configuration')}
            fieldId={asId('configuration-summary')}
          >
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
        submitButtonText={t('kubevirt-plugin~Clone Virtual Machine')}
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
    dataVolumes?: FirehoseResult<V1alpha1DataVolume[]>;
    persistentVolumeClaims?: FirehoseResult<PersistentVolumeClaimKind[]>;
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
  vmi: VMIKind;
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
