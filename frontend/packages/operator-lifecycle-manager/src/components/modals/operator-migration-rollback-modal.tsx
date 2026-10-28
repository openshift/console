import { useState } from 'react';
import {
  Alert,
  AlertVariant,
  Button,
  Checkbox,
  Content,
  Form,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type {
  OperatorMigrationJob,
  OperatorMigrationJobItem,
} from '../../utils/operator-migration-api';
import { startOperatorMigrationRollback } from '../../utils/operator-migration-api';

interface RollbackModalOptions {
  jobID: string;
  item: OperatorMigrationJobItem;
  monitorMigration: (job: OperatorMigrationJob) => Promise<void>;
  onRollbackStarted: () => void;
}

/** Confirms removal of partial migration targets before queuing durable Classic recovery. */
export const OperatorMigrationRollbackModalOverlay: OverlayComponent<RollbackModalOptions> = ({
  jobID,
  item,
  monitorMigration,
  onRollbackStarted,
  closeOverlay,
}) => {
  const { t } = useTranslation('olm');
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const operator = `${item.subscriptionNamespace}/${item.subscriptionName}`;
  /** Queues confirmed target removal and recovery, preserving inline errors when submission fails. */
  const submit = async () => {
    if (!acknowledged || submitting || !item.clusterExtensionName) return;
    setSubmitting(true);
    setError(undefined);
    try {
      const response = await startOperatorMigrationRollback(jobID, item.clusterExtensionName);
      monitorMigration({
        id: response.jobID,
        status: response.status,
        operation: 'Rollback',
        sourceJobID: jobID,
        continueOnError: false,
        items: [{ ...item, status: 'Queued', error: undefined, rolledBack: false }],
      });
      onRollbackStarted();
      closeOverlay();
    } catch (rollbackError) {
      setError(
        rollbackError instanceof Error
          ? rollbackError.message
          : t('Could not start rollback. Try again.'),
      );
      setSubmitting(false);
    }
  };
  return (
    <Modal
      variant={ModalVariant.medium}
      isOpen
      onClose={submitting ? undefined : closeOverlay}
      aria-labelledby="operator-migration-rollback-title"
      aria-describedby="operator-migration-rollback-description"
      data-test="operator-migration-rollback-modal"
    >
      <ModalHeader
        title={t('Roll back to Classic Operators')}
        titleIconVariant="warning"
        titleScreenReaderText={t('Warning')}
        labelId="operator-migration-rollback-title"
      />
      <ModalBody>
        <Content component="p" id="operator-migration-rollback-description">
          {t('Roll back {{operator}} to Operator Lifecycle Manager version 0?', { operator })}
        </Content>
        <Content component="p">
          {t(
            'Rollback removes the ClusterExtension and ClusterObjectSets that migration created and restores the backed-up Subscription. Your workloads remain, but the Operator might not reconcile resource changes or receive updates until Operator Lifecycle Manager version 0 restores management. Recovery time depends on the Operator and cluster conditions. Review your recovery plan before you continue.',
          )}
        </Content>
        <Form>
          <Checkbox
            id="olm-migration-rollback-acknowledged"
            data-test="olm-migration-rollback-acknowledged"
            label={t(
              'I understand that rollback removes the migration resources and moves the Operator back to Operator Lifecycle Manager version 0.',
            )}
            isChecked={acknowledged}
            onChange={(_, checked) => setAcknowledged(checked)}
            isDisabled={submitting}
          />
        </Form>
        {error && (
          <Alert isInline variant={AlertVariant.danger} title={t('Could not start rollback')}>
            <Content component="p">{error}</Content>
            <Content component="p">
              {t(
                'Resolve the reported issue, then try rollback again. If rollback still fails, use your backup or recovery plan.',
              )}
            </Content>
          </Alert>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          variant="danger"
          onClick={submit}
          isDisabled={!acknowledged || submitting}
          isLoading={submitting}
          data-test="confirm-operator-migration-rollback"
        >
          {t('Roll back')}
        </Button>
        <Button variant="link" onClick={closeOverlay} isDisabled={submitting}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
