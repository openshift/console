import * as React from 'react';
import { FormControl } from 'patternfly-react';
import { Alert } from '@patternfly/react-core';
import { withHandlePromise, HandlePromiseProps } from '@console/internal/components/utils';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  createModalLauncher,
  ModalComponentProps,
} from '@console/internal/components/factory';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { CephClusterModel } from '@console/ceph-storage-plugin/src/models';
import { startNodeMaintenance } from '../../k8s/requests/node-maintenance';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';

const cephClusterResource = {
  kind: referenceForModel(CephClusterModel),
  namespaced: false,
  isList: true,
};

export type StartNodeMaintenanceModalProps = HandlePromiseProps &
  ModalComponentProps & {
    nodeName: string;
  };

const StartNodeMaintenanceModal = withHandlePromise<StartNodeMaintenanceModalProps>((props) => {
  const { nodeName, inProgress, errorMessage, handlePromise, close, cancel } = props;

  const [reason, setReason] = React.useState('');

  const submit = (event) => {
    event.preventDefault();
    const promise = startNodeMaintenance(nodeName, reason);
    return handlePromise(promise).then(close);
  };

  const [cephClusters, loaded] = useK8sWatchResource<K8sResourceKind[]>(cephClusterResource);
  const cephCluster = cephClusters?.[0];
  const cephClusterHealthy = !cephCluster || cephCluster?.status?.health === 'OK';

  const action = 'Start Maintenance';
  return (
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle>{action}</ModalTitle>
      <ModalBody>
        <p>
          All managed workloads will be moved off of this node. New workloads and data will not be
          added to this node until maintenance is stopped.
        </p>
        <p>
          If the node does not exit maintenance within <strong>30 minutes</strong>, the cluster will
          automatically rebuild the node&apos;s data using replicated copies
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
        {!cephClusterHealthy && (
          <Alert
            variant="warning"
            title="The Ceph storage cluster is not in a healthy state."
            isInline
          >
            Maintenance should not be started until the health of the storage cluster is restored.
          </Alert>
        )}
      </ModalBody>
      <ModalSubmitFooter
        submitDisabled={!loaded}
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText={action}
        cancel={cancel}
      />
    </form>
  );
});

export const startNodeMaintenanceModal = createModalLauncher(StartNodeMaintenanceModal);
