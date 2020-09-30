import * as React from 'react';
import { FormikProps } from 'formik';
import PipelineResourceSection from '../common/PipelineResourceSection';
import PipelineParameterSection from '../common/PipelineParameterSection';
import PipelineWorkspacesSection from '../common/PiplelineWorkspacesSection';
import TriggerBindingSection from './TriggerBindingSection';
import { AddTriggerFormValues } from './types';

type AddTriggerFormProps = FormikProps<AddTriggerFormValues>;

const AddTriggerForm: React.FC<AddTriggerFormProps> = (props) => {
  const { values } = props;

  return (
    <>
      <TriggerBindingSection />
      <PipelineParameterSection parameters={values.parameters} />
      <PipelineResourceSection />
      <PipelineWorkspacesSection />
    </>
  );
};

export default AddTriggerForm;
