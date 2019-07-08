import * as React from 'react';
import { NumberSpinnerField } from '../../formik-fields';
import FormSection from '../section/FormSection';

const ServerlessScalingSection: React.FC = () => {
  return (
    <FormSection title="Scaling">
      <NumberSpinnerField
        name="serverless.scaling.minpods"
        label="Min Pods"
        helpText="The lower limit for the number of pods that can be set by autoscaler. If not specified defaults to 0."
      />
      <NumberSpinnerField
        name="serverless.scaling.maxpods"
        label="Max Pods"
        helpText="The upper limit for the number of pods that can be set by autoscaler."
      />
      <NumberSpinnerField name="serverless.scaling.concurrencytarget" label="Concurrency Target" />
      <NumberSpinnerField name="serverless.scaling.concurrencylimit" label="Concurrency Limit" />
    </FormSection>
  );
};

export default ServerlessScalingSection;
