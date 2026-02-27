import type { FC } from 'react';
import { useCallback, useState } from 'react';
import {
  Button,
  Form,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
  Title,
} from '@patternfly/react-core';
import type { FormikProps, FormikValues } from 'formik';
import { Formik } from 'formik';
import { Trans, useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import type { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { UNASSIGNED_KEY } from '../../const';
import { updateResourceApplication } from '../../utils/application-utils';
import ApplicationSelector from '../dropdowns/ApplicationSelector';

type EditApplicationFormProps = {
  resource: K8sResourceKind;
  initialApplication: string;
  cancel?: () => void;
};

type EditApplicationModalProps = EditApplicationFormProps & {
  resourceKind: K8sKind;
  close?: () => void;
};

const EditApplicationForm: FC<FormikProps<FormikValues> & EditApplicationFormProps> = ({
  resource,
  handleSubmit,
  isSubmitting,
  cancel,
  values,
  initialApplication,
  status,
}) => {
  const { t } = useTranslation();
  const dirty = values?.application?.selectedKey !== initialApplication;
  return (
    <>
      <ModalHeader title={t('topology~Edit application grouping')} />
      <ModalBody>
        <Form id="edit-application-form" onSubmit={handleSubmit} className="pf-v6-u-mr-md">
          <Title headingLevel="h2" size="md">
            <Trans ns="topology">
              Select an Application group to add the component{' '}
              <strong>{{ resourceName: resource.metadata.name }}</strong> to
            </Trans>
          </Title>
          <ApplicationSelector namespace={resource.metadata.namespace} />
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={status && status.submitError}>
        <Button
          variant="primary"
          type="submit"
          form="edit-application-form"
          isLoading={isSubmitting}
          isDisabled={!dirty || isSubmitting}
          data-test="confirm-action"
          id="confirm-action"
        >
          {t('topology~Save')}
        </Button>
        <Button variant="link" onClick={cancel} data-test-id="modal-cancel-action">
          {t('topology~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

const EditApplicationModal: FC<EditApplicationModalProps> = (props) => {
  const { resourceKind, resource, close } = props;
  const [handlePromise] = usePromiseHandler();

  const handleSubmit = useCallback(
    (values, actions) => {
      const applicationKey = values.application.selectedKey;
      const application = applicationKey === UNASSIGNED_KEY ? undefined : values.application.name;

      return handlePromise(updateResourceApplication(resourceKind, resource, application))
        .then(() => {
          close();
        })
        .catch((errorMessage) => {
          actions.setStatus({ submitError: errorMessage });
        });
    },
    [resourceKind, resource, handlePromise, close],
  );

  const application = resource?.metadata?.labels?.['app.kubernetes.io/part-of'];

  const initialValues = {
    application: {
      name: application,
      selectedKey: application || UNASSIGNED_KEY,
    },
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {(formikProps) => (
        <EditApplicationForm {...formikProps} {...props} initialApplication={application} />
      )}
    </Formik>
  );
};

const EditApplicationModalProvider: OverlayComponent<EditApplicationModalProps> = (props) => {
  const [isOpen, setIsOpen] = useState(true);
  const handleClose = () => {
    setIsOpen(false);
    props.closeOverlay();
  };

  return isOpen ? (
    <Modal variant={ModalVariant.small} isOpen onClose={handleClose}>
      <EditApplicationModal cancel={handleClose} close={handleClose} {...props} />
    </Modal>
  ) : null;
};

export const useEditApplicationModalLauncher = (props) => {
  const launcher = useOverlay();
  return useCallback(
    () => launcher<EditApplicationModalProps>(EditApplicationModalProvider, props),
    [launcher, props],
  );
};
