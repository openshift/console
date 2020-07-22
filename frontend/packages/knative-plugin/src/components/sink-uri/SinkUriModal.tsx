import * as React from 'react';
import { FormikProps, FormikValues } from 'formik';
import { Form, FormGroup, TextInputTypes } from '@patternfly/react-core';
import { InputField, getFieldId } from '@console/shared';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';

export interface SinkUriModalProps {
  cancel?: () => void;
}

type Props = FormikProps<FormikValues> & SinkUriModalProps;

const SinkUriModal: React.FC<Props> = ({
  handleSubmit,
  cancel,
  isSubmitting,
  status,
  values,
  initialValues,
}) => {
  const fieldId = getFieldId('sink-name', 'uri');
  const dirty = values?.uri !== initialValues.uri;
  return (
    <Form onSubmit={handleSubmit}>
      <div className="modal-content modal-content--no-inner-scroll">
        <ModalTitle>Edit URI</ModalTitle>
        <ModalBody>
          <FormSection fullWidth>
            <FormGroup
              fieldId={fieldId}
              helperText="Editing this URI will affect all associated Event Sources."
              isRequired
            >
              <InputField
                type={TextInputTypes.text}
                name="uri"
                placeholder="Enter URI"
                data-test-id="edit-sink-uri"
                required
              />
            </FormGroup>
          </FormSection>
        </ModalBody>
        <ModalSubmitFooter
          inProgress={isSubmitting}
          submitText="Save"
          submitDisabled={!dirty}
          cancel={cancel}
          errorMessage={status.error}
        />
      </div>
    </Form>
  );
};

export default SinkUriModal;
