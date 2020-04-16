import * as React from 'react';
import * as _ from 'lodash';
import { Form } from '@patternfly/react-core';
import { FormikValues } from 'formik';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import FormSection from '../../import/section/FormSection';
import PipelineResourceSection, { ResourceProps } from './PipelineResourceSection';
import PipelineParameterSection from './PipelineParameterSection';
import PipelineWorkspacesSection from './PiplelineWorkspacesSection';
import PipelineSecretSection from './PipelineSecretSection';

const StartPipelineForm: React.FC<FormikValues> = ({
  values,
  errors,
  handleSubmit,
  status,
  isSubmitting,
  close,
}) => {
  const resources: ResourceProps = values.resources.reduce(
    (acc, value, index) => {
      const resource = { ...value, index };
      if (!acc.types.includes(resource.type)) {
        acc.types.push(resource.type);
        acc[resource.type] = [];
      }
      acc[resource.type].push(resource);
      return acc;
    },
    { types: [] },
  );

  return (
    <Form onSubmit={handleSubmit}>
      <div className="modal-content">
        <ModalTitle>Start Pipeline</ModalTitle>
        <ModalBody>
          <PipelineParameterSection parameters={values.parameters} />
          <PipelineResourceSection resources={resources} />
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
