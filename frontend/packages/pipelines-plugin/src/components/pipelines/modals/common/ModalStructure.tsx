import * as React from 'react';
import { Form } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import {
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '@console/internal/components/factory';

type ModalStructureProps = {
  children: React.ReactNode;
  submitBtnText: string;
  submitDanger?: boolean;
  title: string;
};

type ModalStructureCombinedProps = FormikProps<FormikValues> &
  ModalComponentProps &
  ModalStructureProps;

const ModalStructure: React.FC<ModalStructureCombinedProps> = (props) => {
  const {
    children,
    close,
    errors,
    isSubmitting,
    handleSubmit,
    status,
    submitBtnText,
    submitDanger,
    title,
  } = props;

  return (
    <Form onSubmit={handleSubmit}>
      <div className="modal-content">
        <ModalTitle>{title}</ModalTitle>
        <ModalBody>
          <div className="pf-v6-c-form">{children}</div>
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={status?.submitError}
          inProgress={isSubmitting}
          submitText={submitBtnText}
          submitDisabled={!_.isEmpty(errors) || isSubmitting}
          submitDanger={submitDanger}
          cancel={close}
        />
      </div>
    </Form>
  );
};

export default ModalStructure;
