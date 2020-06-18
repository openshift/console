import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { PromiseComponent, history } from '@console/internal/components/utils';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { Formik, FormikProps, FormikValues } from 'formik';
import { YellowExclamationTriangleIcon, InputField } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';

type DeleteResourceModalProps = {
  resourceName: string;
  resourceType: string;
  actionLabel?: string;
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
  actionLabel = 'Delete',
  isSubmitting,
  cancel,
  values,
  status,
}) => {
  const isValid = values.resourceName === resourceName;
  return (
    <form onSubmit={handleSubmit} className="modal-content modal-content--no-inner-scroll">
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" /> {actionLabel} {resourceType}?
      </ModalTitle>
      <ModalBody>
        <p>
          This action cannot be undone. All associated Deployments, Routes, Builds, Pipelines,
          Storage/PVC&#39;s, secrets, and configmaps will be deleted.
        </p>
        <p>
          Confirm deletion by typing <strong className="co-break-word">{resourceName}</strong>{' '}
          below:
        </p>
        <InputField type={TextInputTypes.text} name="resourceName" />
      </ModalBody>
      <ModalSubmitFooter
        submitText={actionLabel}
        submitDisabled={(status && !!status.submitError) || !isValid}
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
    actions.setSubmitting(true);
    const { onSubmit, close, redirect } = this.props;
    onSubmit &&
      this.handlePromise(onSubmit(values))
        .then(() => {
          actions.setSubmitting(false);
          close();
          redirect && history.push(redirect);
        })
        .catch((errorMessage) => {
          actions.setSubmitting(false);
          actions.setStatus({ submitError: errorMessage });
        });
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
