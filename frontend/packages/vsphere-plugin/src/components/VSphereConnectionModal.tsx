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

export const VSphereConnectionModal: React.FC<VSphereConnectionProps> = (props) => {
  const { t } = useTranslation();
  const [isModalOpen, setModalOpen] = React.useState(true);

  const [secretModel] = useK8sModel({ group: 'app', version: 'v1', kind: 'Secret' });
  const [configMapModel] = useK8sModel({ group: 'app', version: 'v1', kind: 'ConfigMap' });
  const [kubeControllerManagerModel] = useK8sModel({
    group: 'operator.openshift.io',
    version: 'v1',
    kind: 'KubeControllerManager',
  });

  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string>();

  const {
    vcenter,
    username,
    password,
    datacenter,
    defaultDatastore,
    folder,
    isDirty,
    setDirty,
  } = useConnectionFormContext();

  const onClose = () => {
    setModalOpen(false);

    // hide popup
    props.hide?.();
  };

  const onSave = () => {
    setIsSaving(true);
    const doItAsync = async () => {
      setError('');

      const errorMsg = await persist(
        t,
        { secretModel, configMapModel, kubeControllerManagerModel },
        {
          vcenter,
          username,
          password,
          datacenter,
          defaultDatastore,
          folder,
        },
        props.cloudProviderConfig,
      );

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
        title={t('vsphere-plugin~vSphere Problem Detector (can be outdated)')}
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
          "vsphere-plugin~After saving the configuration, it might take approximately 1 hour to see if the settings are correct and the operators' statuses are updated, nodes will get rebooted.",
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
    defaultDatastore?.trim();
  const isSaveDisabled = isSaving || !isDirty || !allRequiredFieldsAreSet;

  const footer = (
    <>
      {isSaving ? <InProgress key="progress" text={t('vsphere-plugin~Saving')} /> : null}
      <Button key="cancel" variant="link" onClick={onClose}>
        {t('vsphere-plugin~Cancel')}
      </Button>
      <Button key="save" variant="primary" isDisabled={isSaveDisabled} onClick={onSave}>
        {t('vsphere-plugin~Save configuration')}
      </Button>
    </>
  );

  return (
    <Modal
      className="plugin-vsphere-modal"
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
          <VSphereConnectionForm {...props} />
        </StackItem>
        <StackItem>
          <VSphereOperatorStatuses />
        </StackItem>
        <StackItem>{alert}</StackItem>
      </Stack>
    </Modal>
  );
};
