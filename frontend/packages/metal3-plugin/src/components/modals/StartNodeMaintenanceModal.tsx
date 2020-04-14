import * as React from 'react';
import { FormControl } from 'patternfly-react';
import { Alert } from '@patternfly/react-core';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import {
  withHandlePromise,
  FirehoseResource,
  FirehoseResult,
  Firehose,
  HandlePromiseProps,
} from '@console/internal/components/utils';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  createModalLauncher,
} from '@console/internal/components/factory';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { CephClusterModel } from '@console/ceph-storage-plugin/src/models';
import { startNodeMaintenance } from '../../k8s/requests/node-maintenance';
import { CEPH_FLAG } from '../../features';
import { RootState } from '@console/internal/redux';

const StartNodeMaintenanceModal = withHandlePromise<StartNodeMaintenanceModalProps>((props) => {
  const { nodeName, cephClusters, inProgress, errorMessage, handlePromise, close, cancel } = props;

  const [reason, setReason] = React.useState('');

  const submit = (event) => {
    event.preventDefault();
    const promise = startNodeMaintenance(nodeName, reason);
    return handlePromise(promise).then(close);
  };

  const cephCluster = cephClusters?.data?.[0];
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
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText={action}
        cancel={cancel}
      />
    </form>
  );
});

export type StartNodeMaintenanceModalProps = {
  nodeName: string;
  cephClusters?: FirehoseResult<K8sResourceKind[]>;
  handlePromise: <T>(promise: Promise<T>) => Promise<T>;
  inProgress: boolean;
  errorMessage: string;
  cancel?: () => void;
  close?: () => void;
};

type StartNodeMaintenanceModalFirehoseProps = Diff<
  StartNodeMaintenanceModalProps,
  HandlePromiseProps
>;
const StartNodeMaintenanceModalFirehose: React.FC<StartNodeMaintenanceModalFirehoseProps> = (
  props,
) => {
  const hasCephStorageCapability = useSelector<RootState, boolean>(({ FLAGS }) =>
    FLAGS.get(CEPH_FLAG),
  );

  const resources: FirehoseResource[] = [];
  if (hasCephStorageCapability) {
    resources.push({
      kind: referenceForModel(CephClusterModel),
      namespaced: true,
      namespace: 'openshift-storage',
      isList: true,
      prop: 'cephClusters',
    });
  }

  return (
    <Firehose resources={resources}>
      <StartNodeMaintenanceModal {...props} />
    </Firehose>
  );
};

export const startNodeMaintenanceModal = createModalLauncher(StartNodeMaintenanceModalFirehose);
