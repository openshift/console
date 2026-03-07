import { useCallback, useState } from 'react';
import {
  Alert,
  FormGroup,
  Modal,
  ModalHeader,
  ModalVariant,
  Stack,
  StackItem,
  TextInput,
  ModalBody as PfModalBody,
  ModalFooter as PfModalFooter,
  Button,
} from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/lib-core';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/lib-core';
import type { ModalComponentProps } from '@console/internal/components/factory';
import { ErrorMessage } from '@console/internal/components/utils/button-bar';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { useMaintenanceCapability } from '../../hooks/useMaintenanceCapability';
import { startNodeMaintenance } from '../../k8s/requests/node-maintenance';
import { CephClusterModel } from '../../models';

const cephClusterResource = {
  kind: referenceForModel(CephClusterModel),
  namespaced: false,
  isList: true,
};

export type StartNodeMaintenanceModalProps = ModalComponentProps & {
  nodeName: string;
};

export const StartNodeMaintenanceModal: OverlayComponent<StartNodeMaintenanceModalProps> = (
  props,
) => {
  const { t } = useTranslation();
  const { nodeName, closeOverlay } = props;
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const [model] = useMaintenanceCapability();

  const [reason, setReason] = useState('');

  const submit = (event): void => {
    event.preventDefault();
    const promise = startNodeMaintenance(nodeName, reason, model);
    handlePromise(promise)
      .then(() => {
        closeOverlay();
      })
      .catch(() => {});
  };

  const [cephClusters, loaded] = useK8sWatchResource<K8sResourceKind[]>(cephClusterResource);
  const cephCluster = cephClusters?.[0];
  const cephClusterHealthy = cephCluster?.status?.ceph?.health === 'HEALTH_OK';

  return (
    <Modal isOpen onClose={closeOverlay} variant={ModalVariant.small}>
      <ModalHeader title={t('metal3-plugin~Start Maintenance')} />
      <PfModalBody>
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
                onChange={(_event, value) => setReason(value)}
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
      </PfModalBody>
      <PfModalFooter>
        {errorMessage && <ErrorMessage message={errorMessage} />}
        <Button variant="primary" onClick={submit} isLoading={inProgress} isDisabled={!loaded}>
          {t('metal3-plugin~Start Maintenance')}
        </Button>
        <Button variant="link" onClick={closeOverlay}>
          {t('metal3-plugin~Cancel')}
        </Button>
      </PfModalFooter>
    </Modal>
  );
};

export const useStartNodeMaintenanceModalLauncher = (props: StartNodeMaintenanceModalProps) => {
  const launcher = useOverlay();
  return useCallback(
    () => launcher<StartNodeMaintenanceModalProps>(StartNodeMaintenanceModal, props),
    [launcher, props],
  );
};
