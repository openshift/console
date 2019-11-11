import * as React from 'react';
import * as _ from 'lodash';
import { TextInputTypes } from '@patternfly/react-core';
import { PromiseComponent } from '@console/internal/components/utils';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { Formik, FormikProps, FormikValues } from 'formik';
import { YellowExclamationTriangleIcon } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { InputField } from '../formik-fields';

type DeleteApplicationModalProps = {
  initialApplication: string;
  onSubmit: (values: FormikValues) => Promise<K8sResourceKind[]>;
  cancel?: () => void;
  close?: () => void;
};

type DeleteApplicationModalState = {
  inProgress: boolean;
  errorMessage: string;
};

const DeleteApplicationForm: React.FC<FormikProps<FormikValues> & DeleteApplicationModalProps> = ({
  handleSubmit,
  isSubmitting,
  cancel,
  values,
  initialApplication,
  status,
}) => {
  const isValid = _.get(values, 'application.userInput') === initialApplication;
  return (
    <form onSubmit={handleSubmit} className="modal-content modal-content--no-inner-scroll">
      <ModalTitle>Delete Application</ModalTitle>
      <ModalBody>
        <div className="co-delete-modal">
          <YellowExclamationTriangleIcon className="co-delete-modal__icon" />
          <div>
            <p>
              This action cannot be undone. All associated Deployments, Routes, Builds, Pipelines,
              Storage/PVC&#39;s, secrets, and configmaps will be deleted.
            </p>
            <p>
              Confirm deletion by typing{' '}
              <strong className="co-break-word">{initialApplication}</strong> below:
            </p>
            <InputField type={TextInputTypes.text} name="application.userInput" />
          </div>
        </div>
      </ModalBody>
      <ModalSubmitFooter
        submitText="Delete"
        submitDisabled={(status && !!status.submitError) || !isValid}
        cancel={cancel}
        inProgress={isSubmitting}
        submitDanger
        errorMessage={status && status.submitError}
      />
    </form>
  );
};

class DeleteApplicationModal extends PromiseComponent<
  DeleteApplicationModalProps,
  DeleteApplicationModalState
> {
  private handleSubmit = (values, actions) => {
    actions.setSubmitting(true);
    const { onSubmit, close } = this.props;
    onSubmit &&
      this.handlePromise(onSubmit(values))
        .then(() => {
          actions.setSubmitting(false);
          close();
        })
        .catch((errorMessage) => {
          actions.setSubmitting(false);
          actions.setStatus({ submitError: errorMessage });
          close();
        });
  };

  render() {
    const { initialApplication } = this.props;
    const initialValues = {
      application: {
        name: initialApplication,
        userInput: '',
      },
    };
    return (
      <Formik
        initialValues={initialValues}
        onSubmit={this.handleSubmit}
        render={(formProps) => <DeleteApplicationForm {...formProps} {...this.props} />}
      />
    );
  }
}

export const deleteApplicationModal = createModalLauncher((props: DeleteApplicationModalProps) => (
  <DeleteApplicationModal {...props} />
));
