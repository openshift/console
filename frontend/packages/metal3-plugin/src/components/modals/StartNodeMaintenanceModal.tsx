import * as React from 'react';
import { Alert, FormGroup, Stack, StackItem, TextInput } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { CephClusterModel } from '@console/ceph-storage-plugin/src/models';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  createModalLauncher,
  ModalComponentProps,
} from '@console/internal/components/factory';
import { withHandlePromise, HandlePromiseProps } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { useMaintenanceCapability } from '../../hooks/useMaintenanceCapability';
import { startNodeMaintenance } from '../../k8s/requests/node-maintenance';

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
  const { t } = useTranslation();
  const { nodeName, inProgress, errorMessage, handlePromise, close, cancel } = props;
  const [, model] = useMaintenanceCapability();

  const [reason, setReason] = React.useState('');

  const submit = (event) => {
    event.preventDefault();
    const promise = startNodeMaintenance(nodeName, reason, model);
    return handlePromise(promise, close);
  };

  const [cephClusters, loaded] = useK8sWatchResource<K8sResourceKind[]>(cephClusterResource);
  const cephCluster = cephClusters?.[0];
  const cephClusterHealthy = cephCluster?.status?.ceph?.health === 'HEALTH_OK';

  const action = t('metal3-plugin~Start Maintenance');
  return (
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle>{action}</ModalTitle>
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            {t(
              'metal3-plugin~All managed workloads will be moved off of this node. New workloads and data will not be added to this node until maintenance is stopped.',
            )}
          </StackItem>
          <StackItem>
            <Trans ns="metal3-plugin">
              If the node does not exit maintenance within <strong>30 minutes</strong>, the cluster
              will automatically rebuild the node{"'"}s data using replicated copies
            </Trans>
          </StackItem>
          <StackItem>
            <FormGroup label="Reason" fieldId="node-maintenance-reason">
              <TextInput
                type="text"
                id="node-maintenance-reason"
                value={reason}
                onChange={setReason}
              />
            </FormGroup>
          </StackItem>
          {!!cephCluster && !cephClusterHealthy && (
            <StackItem>
              <Alert
                variant="warning"
                title={t('metal3-plugin~The Ceph storage cluster is not in a healthy state.')}
                isInline
              >
                {t(
                  'metal3-plugin~Maintenance should not be started until the health of the storage cluster is restored.',
                )}
              </Alert>
            </StackItem>
          )}
        </Stack>
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
