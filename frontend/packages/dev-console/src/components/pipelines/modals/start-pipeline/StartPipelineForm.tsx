import * as React from 'react';
import * as _ from 'lodash';
import { Form } from '@patternfly/react-core';
import { FormikValues } from 'formik';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import FormSection from '../../../import/section/FormSection';
import PipelineParameterSection from '../common/PipelineParameterSection';
import PipelineResourceSection from '../common/PipelineResourceSection';
import PipelineWorkspacesSection from '../common/PiplelineWorkspacesSection';
import PipelineSecretSection from '../common/PipelineSecretSection';

const StartPipelineForm: React.FC<FormikValues> = ({
  values,
  errors,
  handleSubmit,
  status,
  isSubmitting,
  close,
}) => {
  return (
    <Form onSubmit={handleSubmit}>
      <div className="modal-content">
        <ModalTitle>Start Pipeline</ModalTitle>
        <ModalBody>
          <PipelineParameterSection parameters={values.parameters} />
          <PipelineResourceSection resourceList={values.resources} />
          <PipelineWorkspacesSection />
          <FormSection title="Advanced Options" fullWidth>
            <PipelineSecretSection namespace={values.namespace} />
          </FormSection>
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={status && status.submitError}
          inProgress={isSubmitting}
          submitText="Start"
          submitDisabled={!_.isEmpty(errors)}
          cancel={close}
        />
      </div>
    </Form>
  );
};

export default StartPipelineForm;
