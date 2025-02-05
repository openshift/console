import * as React from 'react';
import {
  Button,
  Alert,
  AlertVariant,
  Stack,
  StackItem,
  Bullseye,
  Spinner,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import { Modal, ModalVariant } from '@patternfly/react-core/deprecated';
import { Formik, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import * as Yup from 'yup';
import { HealthState, SubsystemHealth } from '@console/dynamic-plugin-sdk';
import { useConnectionForm } from '../hooks/use-connection-form';
import { useConnectionModels } from '../hooks/use-connection-models';
import { usePopupVisibility } from '../hooks/use-popup-visibility';
import { PersistError, persist } from './persist';
import { ConnectionFormFormikValues, VSphereConnectionProps } from './types';
import { getErrorMessage } from './utils';
import { VSphereConnectionForm } from './VSphereConnectionForm';
import { VSphereOperatorStatuses } from './VSphereOperatorStatuses';
import './VSphereConnectionModal.css';

type VSphereConnectionModalFooterProps = {
  onClose: VoidFunction;
  mustPatch: boolean;
};

const VSphereConnectionModalFooter: React.FC<VSphereConnectionModalFooterProps> = ({
  onClose,
  mustPatch,
}) => {
  const { t } = useTranslation('vsphere-plugin');
  const { isSubmitting, isValid, dirty, submitForm } = useFormikContext();
  return (
    <Split hasGutter>
      <SplitItem>
        <Button
          variant="primary"
          isDisabled={isSubmitting || !isValid || (mustPatch ? false : !dirty)}
          onClick={submitForm}
          isLoading={isSubmitting}
        >
          {isSubmitting ? t('Saving') : t('Save configuration')}
        </Button>
      </SplitItem>
      <SplitItem>
        <Button variant="link" onClick={onClose} isDisabled={isSubmitting}>
          {t('Cancel')}
        </Button>
      </SplitItem>
    </Split>
  );
};

type VSphereConnectionModalAlertProps = {
  health: SubsystemHealth;
  error?: { title: string; message: string };
};

const VSphereConnectionModalAlert: React.FC<VSphereConnectionModalAlertProps> = ({
  health,
  error,
}) => {
  const { t } = useTranslation('vsphere-plugin');
  const { isSubmitting } = useFormikContext();

  if (error) {
    return (
      <Alert isInline title={error.title} variant={AlertVariant.danger}>
        {error.message}
      </Alert>
    );
  }

  if (!isSubmitting && health.state === HealthState.WARNING) {
    return (
      <Alert
        isInline
        title={t('vSphere Problem Detector (can be outdated)')}
        variant={AlertVariant.warning}
      >
        {health.message}
      </Alert>
    );
  }

  return (
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
};

const datastoreRegex = /^\/.*?\/datastore\/.+/;
const folderRegex = /^\/.*?\/vm\/.+/;

const validationSchema = Yup.lazy((values: ConnectionFormFormikValues) =>
  Yup.object<ConnectionFormFormikValues>({
    vcenter: Yup.string().required('vCenter is required.'),
    username: Yup.string().required('Username is required.'),
    password: Yup.string().required('Password is required.'),
    datacenter: Yup.string().required('Datacenter is required.'),
    defaultDatastore: Yup.string()
      .required('Default data store is required.')
      .test(
        'Correct prefix',
        `Must start with /${values.datacenter}/datastore/`,
        (value: string) => {
          if (!value || !values.datacenter) {
            return true;
          }
          return value.startsWith(`/${values.datacenter}/datastore/`);
        },
      )
      .matches(datastoreRegex, `Must match regex ${datastoreRegex}`),
    folder: Yup.string()
      .required('Virtual Machine Folder is required.')
      .test('Correct prefix', `Must start with /${values.datacenter}/vm/`, (value: string) => {
        if (!value || !values.datacenter) {
          return true;
        }
        return value.startsWith(`/${values.datacenter}/vm/`);
      })
      .matches(folderRegex, `Must match regex ${folderRegex}`),
    vCenterCluster: Yup.string().required('vCenter cluster is required.'),
  }),
);

export const VSphereConnectionModal: React.FC<VSphereConnectionProps> = ({
  health,
  hide,
  cloudProviderConfig,
}) => {
  usePopupVisibility();
  const { t } = useTranslation('vsphere-plugin');
  const [isModalOpen, setModalOpen] = React.useState(true);
  const [error, setError] = React.useState<{ title: string; message: string }>();

  const models = useConnectionModels();

  const { initValues, isLoaded, mustPatch, error: loadError } = useConnectionForm(
    cloudProviderConfig,
  );

  const onClose = () => {
    setModalOpen(false);
    hide();
  };

  const onSave = async (values: ConnectionFormFormikValues) => {
    setError(undefined);

    try {
      await persist(t, models, values, cloudProviderConfig);
      onClose();
    } catch (e) {
      if (e instanceof PersistError) {
        setError({ title: e.message, message: e.detail });
      } else {
        setError({ title: t('An error occured.'), message: getErrorMessage(t, e) });
      }
    }
  };

  let modalBody: React.ReactNode;

  if (loadError) {
    modalBody = (
      <Alert isInline title={loadError.title} variant="danger">
        {loadError.message}
      </Alert>
    );
  } else if (isLoaded) {
    modalBody = (
      <Formik<ConnectionFormFormikValues>
        initialValues={initValues}
        onSubmit={onSave}
        validationSchema={validationSchema}
      >
        <Stack hasGutter>
          <StackItem>
            <VSphereConnectionForm />
          </StackItem>
          <StackItem>
            <VSphereOperatorStatuses />
          </StackItem>
          <StackItem>
            <VSphereConnectionModalAlert error={error} health={health} />
          </StackItem>
          <StackItem>
            <VSphereConnectionModalFooter onClose={onClose} mustPatch={mustPatch || !!error} />
          </StackItem>
        </Stack>
      </Formik>
    );
  } else {
    modalBody = (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  return (
    isModalOpen && (
      <Modal
        className="plugin-vsphere-modal"
        variant={ModalVariant.medium}
        position="top"
        title={t('vSphere connection configuration')}
        isOpen
        showClose={!isLoaded}
        onClose={!isLoaded ? onClose : undefined}
      >
        {modalBody}
      </Modal>
    )
  );
};
