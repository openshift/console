import * as React from 'react';
import { FormikProps } from 'formik';
import { useAddTriggerParams } from '../../../shared/common/auto-complete/autoCompleteValueParsers';
import PipelineResourceSection from '../common/PipelineResourceSection';
import PipelineParameterSection from '../common/PipelineParameterSection';
import PipelineWorkspacesSection from '../common/PipelineWorkspacesSection';
import TriggerBindingSection from './TriggerBindingSection';
import { AddTriggerFormValues } from './types';

type AddTriggerFormProps = FormikProps<AddTriggerFormValues>;

const AddTriggerForm: React.FC<AddTriggerFormProps> = (props) => {
  const { values } = props;

  const autoCompleteValues: string[] = useAddTriggerParams();

  return (
    <>
      <TriggerBindingSection />
      <PipelineParameterSection
        autoCompleteValues={autoCompleteValues}
        parameters={values.parameters}
      />
      <PipelineResourceSection />
      <PipelineWorkspacesSection />
    </>
  );
};

export default AddTriggerForm;
