import * as React from 'react';
import { NumberSpinnerField } from '../../formik-fields';
import FormSection from '../section/FormSection';

const ScalingSection: React.FC = () => {
  return (
    <FormSection title="Scaling" subTitle="Replicas are scaled manually based on CPU usage.">
      <NumberSpinnerField
        name="deployment.replicas"
        label="Replicas"
        helpText="The number of instances of your image."
      />
    </FormSection>
  );
};

export default ScalingSection;
