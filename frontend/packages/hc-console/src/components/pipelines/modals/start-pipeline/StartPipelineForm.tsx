import * as React from 'react';
import { FormikValues } from 'formik';
import FormSection from '../../../import/section/FormSection';
import PipelineParameterSection from '../common/PipelineParameterSection';
import PipelineResourceSection from '../common/PipelineResourceSection';
import PipelineWorkspacesSection from '../common/PiplelineWorkspacesSection';
import PipelineSecretSection from '../common/PipelineSecretSection';

const StartPipelineForm: React.FC<FormikValues> = ({ values }) => {
  return (
    <>
      <PipelineParameterSection parameters={values.parameters} />
      <PipelineResourceSection />
      <PipelineWorkspacesSection />
      <FormSection title="Advanced Options" fullWidth>
        <PipelineSecretSection namespace={values.namespace} />
      </FormSection>
    </>
  );
};

export default StartPipelineForm;
