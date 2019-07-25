import * as React from 'react';
import { NumberSpinnerField } from '../../formik-fields';
import FormSection from '../section/FormSection';

const ServerlessScalingSection: React.FC = () => {
  return (
    <FormSection
      title="Scaling"
      subTitle="Set the autoscaler parameters around pods and concurrency limits in this section."
    >
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
      <NumberSpinnerField
        name="serverless.scaling.concurrencytarget"
        label="Concurrency Target"
        helpText="Defines how many concurrent requests are wanted per instance of the application at a given time (soft limit) and is the recommended configuration for autoscaling. If not specified, will be defaulted to the value set in the cluster config."
      />
      <NumberSpinnerField
        name="serverless.scaling.concurrencylimit"
        label="Concurrency Limit"
        helpText="Limits the amount of concurrent requests allowed into one instance of the application at a given time (hard limit), and is configured in the revision template. If not specified, will be defaulted to the value set in the cluster config."
      />
    </FormSection>
  );
};

export default ServerlessScalingSection;
