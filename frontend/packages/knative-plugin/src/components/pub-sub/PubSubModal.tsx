import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { InputField } from '@console/shared';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { TextInputTypes } from '@patternfly/react-core';
import PubSubSubscriber from './form-fields/PubSubSubscriber';
import PubSubFilter from './form-fields/PubSubFilter';

export interface PubSubModalProps {
  filterEnabled: boolean;
  labelTitle: string;
  cancel?: () => void;
}

type Props = FormikProps<FormikValues> & PubSubModalProps;

const PubSubModal: React.FC<Props> = ({
  filterEnabled,
  labelTitle,
  handleSubmit,
  cancel,
  isSubmitting,
  status,
  dirty,
  errors,
}) => (
  <form className="modal-content modal-content--no-inner-scroll" onSubmit={handleSubmit}>
    <ModalTitle>{labelTitle}</ModalTitle>
    <ModalBody>
      <FormSection fullWidth>
        <InputField type={TextInputTypes.text} name="metadata.name" label="Name" required />
        <PubSubSubscriber />
        {filterEnabled && <PubSubFilter />}
      </FormSection>
    </ModalBody>
    <ModalSubmitFooter
      inProgress={isSubmitting}
      submitText="Add"
      submitDisabled={!dirty || !_.isEmpty(errors)}
      cancel={cancel}
      errorMessage={status.error}
    />
  </form>
);

export default PubSubModal;
