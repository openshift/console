import * as React from 'react';
import {
  Alert,
  Button,
  FormGroup,
  Modal,
  ModalVariant,
  ModalFooter,
  Stack,
  StackItem,
  TextInput,
} from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { useMaintenanceCapability } from '../../hooks/useMaintenanceCapability';
import { startNodeMaintenance } from '../../k8s/requests/node-maintenance';
import { CephClusterModel } from '../../models';

const cephClusterResource = {
  kind: referenceForModel(CephClusterModel),
  namespaced: false,
  isList: true,
};

export type StartNodeMaintenanceModalProps = {
  nodeName: string;
  closeOverlay: () => void;
};

const StartNodeMaintenanceModal: React.FC<StartNodeMaintenanceModalProps> = ({
  nodeName,
  closeOverlay,
}) => {
  const { t } = useTranslation();
  const [model] = useMaintenanceCapability();
  const [reason, setReason] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      await startNodeMaintenance(nodeName, reason, model);
      closeOverlay();
    } catch (error) {
      // Error handling - could be logged to monitoring system in production
    } finally {
      setIsSubmitting(false);
    }
  };

  const [cephClusters, loaded] = useK8sWatchResource<K8sResourceKind[]>(cephClusterResource);
  const cephCluster = cephClusters?.[0];
  const cephClusterHealthy = cephCluster?.status?.ceph?.health === 'HEALTH_OK';

  return (
    <Modal
      variant={ModalVariant.medium}
      title={t('metal3-plugin~Start Maintenance')}
      isOpen
      onClose={closeOverlay}
    >
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
      <ModalFooter>
        <Button
          variant="primary"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          isDisabled={isSubmitting || !loaded}
        >
          {t('metal3-plugin~Start Maintenance')}
        </Button>
        <Button variant="secondary" onClick={closeOverlay}>
          {t('console-app~Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export const useStartNodeMaintenanceModal = () => {
  const launchOverlay = useOverlay();
  return (props: Omit<StartNodeMaintenanceModalProps, 'closeOverlay'>) => {
    launchOverlay(StartNodeMaintenanceModal, props);
  };
};
