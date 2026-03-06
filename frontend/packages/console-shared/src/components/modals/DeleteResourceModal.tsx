import type { FC } from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import type { FormikProps, FormikValues } from 'formik';
import { Formik } from 'formik';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { usePromiseHandler } from '../../hooks/promise-handler';
import { InputField } from '../formik-fields';
import { YellowExclamationTriangleIcon } from '../status';

type DeleteResourceModalProps = {
  resourceName: string;
  resourceType: string;
  actionLabel?: string; // Used to send translated strings as action label.
  actionLabelKey?: string; // Used to send translation key for action label.
  redirect?: string;
  onSubmit: (values: FormikValues) => Promise<K8sResourceKind[]>;
  cancel?: () => void;
  close?: () => void;
};

const DeleteResourceForm: FC<FormikProps<FormikValues> & DeleteResourceModalProps> = ({
  handleSubmit,
  resourceName,
  resourceType,
  actionLabel,
  // t('console-shared~Delete')
  actionLabelKey = 'console-shared~Delete',
  isSubmitting,
  cancel,
  values,
  status,
}) => {
  const { t } = useTranslation();
  const isValid = values.resourceName === resourceName;
  const submitLabel = actionLabel || t(actionLabelKey);
  return (
    <form onSubmit={handleSubmit} className="modal-content">
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" /> {submitLabel} {resourceType}?
      </ModalTitle>
      <ModalBody>
        <p>
          {t(
            `console-shared~This action cannot be undone. All associated Deployments, Routes, Builds, Pipelines, Storage/PVCs, Secrets, and ConfigMaps will be deleted.`,
          )}
        </p>
        <p>
          <Trans ns="console-shared">
            Confirm deletion by typing <strong className="co-break-word">{{ resourceName }}</strong>{' '}
            below:
          </Trans>
        </p>
        <InputField type={TextInputTypes.text} name="resourceName" />
      </ModalBody>
      <ModalSubmitFooter
        submitText={submitLabel}
        submitDisabled={(status && !!status.submitError) || !isValid || isSubmitting}
        cancel={cancel}
        inProgress={isSubmitting}
        submitDanger
        errorMessage={status && status.submitError}
      />
    </form>
  );
};

const DeleteResourceModal: FC<DeleteResourceModalProps> = (props) => {
  const [handlePromise] = usePromiseHandler();
  const navigate = useNavigate();

  const handleSubmit = (values: FormikValues, actions) => {
    const { onSubmit, close, redirect } = props;
    actions.setStatus({ submitError: null });
    return (
      onSubmit &&
      handlePromise(onSubmit(values))
        .then(() => {
          close();
          redirect && navigate(redirect);
        })
        .catch((errorMessage) => {
          actions.setStatus({ submitError: errorMessage });
        })
    );
  };

  const initialValues = {
    resourceName: '',
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {(formikProps) => <DeleteResourceForm {...formikProps} {...props} />}
    </Formik>
  );
};

export const deleteResourceModal = createModalLauncher((props: DeleteResourceModalProps) => (
  <DeleteResourceModal {...props} />
));
