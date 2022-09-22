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
import { useK8sModel } from '@console/dynamic-plugin-sdk/src/api/core-api';
import { useConnectionFormContext } from './ConnectionFormContext';
import { InProgress } from './InProgress';
import { persist } from './persist';
import { VSphereConnectionProps } from './types';
import { VSphereConnectionForm } from './VSphereConnectionForm';
import { VSphereOperatorStatuses } from './VSphereOperatorStatuses';
import './VSphereConnectionModal.css';

export const VSphereConnectionModal: React.FC<VSphereConnectionProps> = (params) => {
  const { t } = useTranslation();
  const [isModalOpen, setModalOpen] = React.useState(true);

  const [SecretModel] = useK8sModel({ group: 'app', version: 'v1', kind: 'Secret' });
  const [ConfigMapModel] = useK8sModel({ group: 'app', version: 'v1', kind: 'ConfigMap' });

  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string>();

  const {
    vcenter,
    username,
    password,
    datacenter,
    defaultdatastore,
    folder,
    isDirty,
    setDirty,
  } = useConnectionFormContext();

  const formId = 'vsphere-connection-modal-form';

  const onClose = () => {
    setModalOpen(false);

    // hide popup
    params.hide && params.hide();
  };

  const onSave = () => {
    setIsSaving(true);
    const doItAsync = async () => {
      setError('');

      const errorMsg = await persist(
        t,
        { SecretModel, ConfigMapModel },
        {
          vcenter,
          username,
          password,
          datacenter,
          defaultdatastore,
          folder,
        },
        params.cloudProviderConfig,
      );

      // Done
      setIsSaving(false);

      if (errorMsg) {
        setError(errorMsg);
        setIsSaving(false);
        return;
      }

      // We are all good now
      setDirty(false); // Or call initialLoad() instead
    };

    doItAsync();
  };

  let alert;
  if (!error && !isSaving && params.health.state === HealthState.WARNING) {
    alert = (
      <Alert
        isInline
        title={t('vsphere-plugin~vSphere Problem Detector (can be outdated)')}
        variant={AlertVariant.warning}
      >
        {params.health.message}
      </Alert>
    );
  } else if (error) {
    alert = (
      <Alert
        isInline
        title={error}
        actionLinks={
          <AlertActionLink onClick={onSave}>{t('vsphere-plugin~Retry')}</AlertActionLink>
        }
        variant={AlertVariant.danger}
      />
    );
  } else {
    alert = (
      <Alert
        variant={AlertVariant.info}
        isInline
        title={t('vsphere-plugin~Delayed propagation of configuration')}
      >
        {t(
          "vsphere-plugin~After saving the configuration, it may take approximately one hour to see if the settings are correct and the operators' statuses are updated, nodes will get rebooted.",
        )}
        <br />
        {t(
          'vsphere-plugin~Note, that existing resources (like already bound PVCs) might get broken by these changes.',
        )}
      </Alert>
    );
  }

  const allRequiredFieldsAreSet =
    vcenter?.trim() &&
    username?.trim() &&
    password?.trim() &&
    datacenter?.trim() &&
    defaultdatastore?.trim();
  const isSaveDisabled = isSaving || !isDirty || !allRequiredFieldsAreSet;

  const footer = (
    <>
      {isSaving ? <InProgress key="progress" text={t('vsphere-plugin~Saving...')} /> : null}
      <Button key="cancel" variant="link" onClick={onClose}>
        Cancel
      </Button>
      <Button key="save" variant="primary" isDisabled={isSaveDisabled} onClick={onSave}>
        Save configuration
      </Button>
    </>
  );

  return (
    <Modal
      className="vsphere-connection-modal"
      variant={ModalVariant.medium}
      position="top"
      title={t('vsphere-plugin~vSphere connection configuration')}
      // description=""
      isOpen={isModalOpen}
      onClose={onClose}
      footer={footer}
    >
      <Stack hasGutter>
        <StackItem>
          <VSphereConnectionForm {...params} formId={formId} />
        </StackItem>
        <StackItem>
          <VSphereOperatorStatuses />
        </StackItem>
        <StackItem>{alert}</StackItem>
      </Stack>
    </Modal>
  );
};
