import type { FC } from 'react';
import { useCallback } from 'react';
import { Title } from '@patternfly/react-core';
import { Formik, FormikProps, FormikValues } from 'formik';
import { Trans, useTranslation } from 'react-i18next';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalWrapper,
} from '@console/internal/components/factory/modal';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
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
    <form onSubmit={handleSubmit} className="modal-content">
      <ModalTitle>{t('topology~Edit application grouping')}</ModalTitle>
      <ModalBody>
        <Title headingLevel="h2" size="md" className="co-m-form-row">
          <Trans ns="topology">
            Select an Application group to add the component{' '}
            <strong>{{ resourceName: resource.metadata.name }}</strong> to
          </Trans>
        </Title>
        <div className="pf-v6-c-form">
          <ApplicationSelector namespace={resource.metadata.namespace} />
        </div>
      </ModalBody>
      <ModalSubmitFooter
        submitText={t('topology~Save')}
        submitDisabled={!dirty || isSubmitting}
        cancel={cancel}
        inProgress={isSubmitting}
        errorMessage={status && status.submitError}
      />
    </form>
  );
};

const EditApplicationModal: React.FC<EditApplicationModalProps> = (props) => {
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
  return (
    <ModalWrapper blocking onClose={props.closeOverlay}>
      <EditApplicationModal cancel={props.closeOverlay} close={props.closeOverlay} {...props} />
    </ModalWrapper>
  );
};

export const useEditApplicationModalLauncher = (props) => {
  const launcher = useOverlay();
  return useCallback(
    () => launcher<EditApplicationModalProps>(EditApplicationModalProvider, props),
    [launcher, props],
  );
};
