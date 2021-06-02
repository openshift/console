import * as React from 'react';
import { FormikProps } from 'formik';
import { useAddTriggerParams } from '../../../shared/common/auto-complete/autoCompleteValueParsers';
import PipelineParameterSection from '../common/PipelineParameterSection';
import PipelineResourceSection from '../common/PipelineResourceSection';
import PipelineWorkspacesSection from '../common/PipelineWorkspacesSection';
import TriggerBindingSection from './TriggerBindingSection';
import { AddTriggerFormValues } from './types';

const AddTriggerForm: React.FC<FormikProps<AddTriggerFormValues>> = () => {
  const autoCompleteValues: string[] = useAddTriggerParams();

  return (
    <>
      <TriggerBindingSection />
      <PipelineParameterSection autoCompleteValues={autoCompleteValues} />
      <PipelineResourceSection />
      <PipelineWorkspacesSection />
    </>
  );
};

export default AddTriggerForm;
