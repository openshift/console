import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { Formik, FormikProps, FormikValues } from 'formik';
import { useTranslation, Trans } from 'react-i18next';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { PromiseComponent, history } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { InputField } from '../formik-fields';
import { YellowExclamationTriangleIcon } from '../status';

type DeleteResourceModalProps = {
  resourceName: string;
  resourceType: string;
  actionLabelKey?: string;
  redirect?: string;
  onSubmit: (values: FormikValues) => Promise<K8sResourceKind[]>;
  cancel?: () => void;
  close?: () => void;
};

type DeleteResourceModalState = {
  inProgress: boolean;
  errorMessage: string;
};

const DeleteResourceForm: React.FC<FormikProps<FormikValues> & DeleteResourceModalProps> = ({
  handleSubmit,
  resourceName,
  resourceType,
  // t('console-shared~Delete')
  actionLabelKey = 'console-shared~Delete',
  isSubmitting,
  cancel,
  values,
  status,
}) => {
  const { t } = useTranslation();
  const isValid = values.resourceName === resourceName;
  const submitLabel = t(actionLabelKey);
  return (
    <form onSubmit={handleSubmit} className="modal-content modal-content--no-inner-scroll">
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

class DeleteResourceModal extends PromiseComponent<
  DeleteResourceModalProps,
  DeleteResourceModalState
> {
  private handleSubmit = (values, actions) => {
    const { onSubmit, close, redirect } = this.props;
    return (
      onSubmit &&
      this.handlePromise(onSubmit(values))
        .then(() => {
          close();
          redirect && history.push(redirect);
        })
        .catch((errorMessage) => {
          actions.setStatus({ submitError: errorMessage });
        })
    );
  };

  render() {
    const initialValues = {
      resourceName: '',
    };
    return (
      <Formik initialValues={initialValues} onSubmit={this.handleSubmit}>
        {(formikProps) => <DeleteResourceForm {...formikProps} {...this.props} />}
      </Formik>
    );
  }
}

export const deleteResourceModal = createModalLauncher((props: DeleteResourceModalProps) => (
  <DeleteResourceModal {...props} />
));
