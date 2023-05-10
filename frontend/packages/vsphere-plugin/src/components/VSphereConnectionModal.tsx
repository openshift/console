import * as React from 'react';
import {
  Modal,
  ModalVariant,
  Button,
  Alert,
  AlertVariant,
  AlertActionLink,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { HealthState } from '@console/dynamic-plugin-sdk';
import { useConnectionModels } from '../hooks/use-connection-models';
import { useConnectionFormContext } from './ConnectionFormContext';
import { persist } from './persist';
import { VSphereConnectionProps } from './types';
import { VSphereConnectionForm } from './VSphereConnectionForm';
import { VSphereOperatorStatuses } from './VSphereOperatorStatuses';
import './VSphereConnectionModal.css';

export const VSphereConnectionModal: React.FC<VSphereConnectionProps> = (props) => {
  const { t } = useTranslation('vsphere-plugin');
  const [isModalOpen, setModalOpen] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string>();

  const models = useConnectionModels();

  const { values, isDirty, setDirty, isValid } = useConnectionFormContext();

  const onClose = () => {
    if (isSaving) {
      return;
    }
    setModalOpen(false);

    // hide popup
    props.hide?.();
  };

  const onSave = () => {
    setIsSaving(true);
    const doItAsync = async () => {
      setError('');

      const errorMsg = await persist(models, values, props.cloudProviderConfig);

      // Done
      setIsSaving(false);

      if (errorMsg) {
        setError(errorMsg);
        return;
      }

      // We are all good now
      setDirty(false); // Or call initialLoad() instead
    };

    doItAsync();
  };

  let alert;
  if (!error && !isSaving && props.health.state === HealthState.WARNING) {
    alert = (
      <Alert
        isInline
        title={t('vSphere Problem Detector (can be outdated)')}
        variant={AlertVariant.warning}
      >
        {props.health.message}
      </Alert>
    );
  } else if (error) {
    alert = (
      <Alert
        isInline
        title={error}
        actionLinks={<AlertActionLink onClick={onSave}>{t('Retry')}</AlertActionLink>}
        variant={AlertVariant.danger}
      />
    );
  } else {
    alert = (
      <Alert variant={AlertVariant.info} isInline title={t('Delayed propagation of configuration')}>
        {t(
          'The configuration process updates operator statuses and reboots nodes. This process typically takes about an hour. Existing resources such as previously bound Persistent Volume Claims might become disconnected.',
        )}
        <br />
        {t(
          'Note, that existing resources (like already bound PVCs) might get broken by these changes.',
        )}
      </Alert>
    );
  }

  const isSaveDisabled = isSaving || !isDirty || !isValid;

  const footer = (
    <>
      <Button variant="link" onClick={onClose} isDisabled={isSaving}>
        {t('Cancel')}
      </Button>
      <Button variant="primary" isDisabled={isSaveDisabled} onClick={onSave} isLoading={isSaving}>
        {isSaving ? t('Saving') : t('Save configuration')}
      </Button>
    </>
  );

  return (
    isModalOpen && (
      <Modal
        className="plugin-vsphere-modal"
        variant={ModalVariant.medium}
        position="top"
        title={t('vSphere connection configuration')}
        isOpen
        onClose={onClose}
        footer={footer}
      >
        <Stack hasGutter>
          <StackItem>
            <VSphereConnectionForm {...props} />
          </StackItem>
          <StackItem>
            <VSphereOperatorStatuses />
          </StackItem>
          <StackItem>{alert}</StackItem>
        </Stack>
      </Modal>
    )
  );
};
