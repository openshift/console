import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import { FormGroup, TextInput } from '@patternfly/react-core';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '@console/internal/components/factory';
import {
  ExternalLink,
  Firehose,
  FirehoseResult,
  HandlePromiseProps,
  withHandlePromise,
} from '@console/internal/components/utils';
import { YellowExclamationTriangleIcon } from '@console/shared/src';
import {
  CONFIRMATION_TEXT,
  ERROR_MSG_INVALID_INPUT,
  ERROR_MSG_NO_INPUT,
  UNINSTALL_KUBEVIRT_MODAL_TITLE,
} from './strings';
import { VirtualMachineInstanceModel, VirtualMachineModel } from '../../../models';
import { VMIKind, VMKind } from '../../../types/vm';
import { getBasicID, getLoadedData } from '../../../utils';

const getNumberOfVMsOnCluster = (
  vms: FirehoseResult<VMKind[]>,
  vmis: FirehoseResult<VMIKind[]>,
): number => {
  const loadedVMs = getLoadedData(vms);
  const loadedVMIs = getLoadedData(vmis);

  const virtualMachines = _.unionBy(loadedVMs, loadedVMIs, getBasicID);
  return virtualMachines.length;
};

const UninstallKubevirtModal = withHandlePromise((props: UninstallKubevirtModalProps) => {
  const {
    inProgress,
    title = UNINSTALL_KUBEVIRT_MODAL_TITLE,
    handlePromise,
    cancel,
    close,
    vms,
    vmis,
  } = props;
  const [errorMessage, setErrorMessage] = React.useState('');
  const [showErrorMessage, setShowErrorMessage] = React.useState(false);
  const [confirmationTextInput, setConfirmationTextInput] = React.useState('');
  const numOfVMSOnCluster = React.useMemo(() => getNumberOfVMsOnCluster(vms, vmis), [vms, vmis]);

  React.useEffect(() => {
    let errorMsg = '';
    if (numOfVMSOnCluster > 1 && confirmationTextInput !== CONFIRMATION_TEXT) {
      errorMsg = confirmationTextInput === '' ? ERROR_MSG_NO_INPUT : ERROR_MSG_INVALID_INPUT;
    }
    setErrorMessage(errorMsg);
  }, [confirmationTextInput, numOfVMSOnCluster, setErrorMessage]);

  const onConfirmTextInputChange = (input: string) => {
    setShowErrorMessage(false); // clear the error message when user edits input
    setConfirmationTextInput(input);
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (errorMessage !== '') {
      setShowErrorMessage(true);
      return;
    }

    const promise = new Promise((resolve) => {
      // TODO Add uninstallation call
      console.log(event); // eslint-disable-line no-console
      resolve();
    });

    handlePromise(promise).then(() => close()); // eslint-disable-line promise/catch-or-return
  };

  return (
    <form onSubmit={onSubmit} name="form" className="modal-content co-catalog-install-modal">
      <ModalTitle className="modal-header">
        <YellowExclamationTriangleIcon className="co-icon-space-r" /> {title}
      </ModalTitle>
      <ModalBody>
        <p>
          By uninstalling this operator, all virtual machines will be deleted along with their
          storage. This action cannot be reversed and will result in data loss. Virtualization will
          no longer be available on this cluster.
        </p>
        {numOfVMSOnCluster ? (
          <>
            <p>
              <ExternalLink
                href="/k8s/all-namespaces/virtualization"
                text={`${numOfVMSOnCluster} virtual machines found on this cluster`}
              />
            </p>
            <p>
              Confirm uninstallation and deletion of all virtual machines by typing{' '}
              <strong>{CONFIRMATION_TEXT}</strong> below:
            </p>
            <FormGroup
              className="pf-m-3-col-on-md"
              fieldId="confirm-vm-deletion-text-input"
              id="confirm-vm-deletion-text-input"
              isValid={!!errorMessage}
              validated="error"
            >
              <TextInput
                type="text"
                value={confirmationTextInput}
                onChange={(v) => onConfirmTextInputChange(v)}
                aria-label="confirmation input"
              />
            </FormGroup>
          </>
        ) : (
          <strong>No virtual machines found on this cluster</strong>
        )}
      </ModalBody>
      <ModalSubmitFooter
        inProgress={inProgress}
        errorMessage={showErrorMessage ? errorMessage : null}
        cancel={cancel}
        submitDanger
        submitText="Uninstall"
      />
    </form>
  );
});

const resources = [
  {
    kind: VirtualMachineModel.kind,
    prop: 'vms',
    isList: true,
  },
  {
    kind: VirtualMachineInstanceModel.kind,
    prop: 'vmis',
    isList: true,
  },
];

const UninstallKubevirtModalWrapped = (props) => (
  <Firehose resources={resources}>
    <UninstallKubevirtModal {...props} />
  </Firehose>
);

export type UninstallKubevirtModalProps = HandlePromiseProps &
  ModalComponentProps & {
    title?: string;
    vms?: FirehoseResult<VMKind[]>;
    vmis?: FirehoseResult<VMIKind[]>;
  };

const UninstallKubevirtModalConnected = connect()(UninstallKubevirtModalWrapped);

export const UninstallKubevirtModalEnhanced = createModalLauncher(UninstallKubevirtModalConnected);
