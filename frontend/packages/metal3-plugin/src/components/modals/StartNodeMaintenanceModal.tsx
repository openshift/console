import * as React from 'react';
import { FormControl } from 'patternfly-react';
import * as _ from 'lodash';
import { Alert } from '@patternfly/react-core';
import {
  withHandlePromise,
  FirehoseResource,
  FirehoseResult,
} from '@console/internal/components/utils';
import { ModalTitle, ModalBody, ModalSubmitFooter } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { CephClusterModel } from '@console/ceph-storage-plugin/src/models';
import { startNodeMaintenance } from '../../k8s/requests/node-maintenance';
import { createModalResourceLauncher } from './create-modal-resource-launcher';

const StartNodeMaintenanceModal = withHandlePromise((props: NodeMaintenanceModalProps) => {
  const {
    nodeName,
    cephClusterHealthy,
    inProgress,
    errorMessage,
    handlePromise,
    close,
    cancel,
  } = props;

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
  cephClusterHealthy: boolean;
  handlePromise: <T>(promise: Promise<T>) => Promise<T>;
  inProgress: boolean;
  errorMessage: string;
  cancel?: () => void;
  close?: () => void;
};

const resourcesToProps = ({ cephClusters }: { [key: string]: FirehoseResult }) => {
  const cephCluster = _.get(cephClusters, 'data.0');
  return {
    cephClusterHealthy: !cephCluster || _.get(cephCluster, 'status.health') === 'OK',
  };
};

const resources: FirehoseResource[] = [
  {
    kind: referenceForModel(CephClusterModel),
    namespaced: true,
    namespace: 'openshift-storage',
    isList: true,
    prop: 'cephClusters',
  },
];

export const startNodeMaintenanceModal = createModalResourceLauncher(
  StartNodeMaintenanceModal,
  resources,
  resourcesToProps,
);
