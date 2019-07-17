import * as React from 'react';

import { FormControl } from 'patternfly-react';

import { withHandlePromise } from '@console/internal/components/utils';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory';

import { startNodeMaintenance } from '../../k8s/requests/node-maintenance';

const StartNodeMaintenanceModal = withHandlePromise((props: NodeMaintenanceModalProps) => {
  const { nodeName, inProgress, errorMessage, handlePromise, close, cancel } = props;

  const [reason, setReason] = React.useState('');

  const submit = (event) => {
    event.preventDefault();
    const promise = startNodeMaintenance(nodeName, reason);
    return handlePromise(promise).then(close);
  };

  const action = 'Start Maintenance';
  return (
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle>{action}</ModalTitle>
      <ModalBody>
        <p>
          All managed workloads will be moved off of this host. New workloads and data will not be
          added to this host until maintenance is stopped.
        </p>
        <p>
          If the host does not exit maintenance within <strong>30 minutes</strong>, the cluster will
          automatically rebuild the host&apos;s data using replicated copies
        </p>
        <div className="form-group">
          <label htmlFor="node-maintenance-reason">Reason</label>
          <FormControl
            type="text"
            id="node-maintenance-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText={action}
        cancel={cancel}
      />
    </form>
  );
});

export type NodeMaintenanceModalProps = {
  nodeName: string;
  handlePromise: <T>(promise: Promise<T>) => Promise<T>;
  inProgress: boolean;
  errorMessage: string;
  cancel: () => void;
  close: () => void;
};

export const startNodeMaintenanceModal = createModalLauncher(StartNodeMaintenanceModal);
