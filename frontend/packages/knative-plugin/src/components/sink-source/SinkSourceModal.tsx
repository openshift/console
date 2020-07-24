import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { SinkUriResourcesGroup } from '../add/event-sources/SinkSection';

export interface SinkSourceModalProps {
  resourceName: string;
  namespace: string;
  cancel?: () => void;
}

type Props = FormikProps<FormikValues> & SinkSourceModalProps;

const SinkSourceModal: React.FC<Props> = ({
  resourceName,
  namespace,
  handleSubmit,
  cancel,
  isSubmitting,
  status,
  errors,
  values,
  initialValues,
}) => {
  const dirty =
    values?.sink?.name !== initialValues.sink.name || values?.sink?.uri !== initialValues.sink.uri;
  return (
    <form className="modal-content modal-content--no-inner-scroll" onSubmit={handleSubmit}>
      <ModalTitle>Move Sink</ModalTitle>
      <ModalBody>
        <p>
          Connects <strong>{resourceName}</strong> to
        </p>
        <FormSection fullWidth>
          <SinkUriResourcesGroup namespace={namespace} isMoveSink />
        </FormSection>
      </ModalBody>
      <ModalSubmitFooter
        inProgress={isSubmitting}
        submitText="Save"
        submitDisabled={!dirty || !_.isEmpty(errors)}
        cancel={cancel}
        errorMessage={status.error}
      />
    </form>
  );
};

export default SinkSourceModal;
