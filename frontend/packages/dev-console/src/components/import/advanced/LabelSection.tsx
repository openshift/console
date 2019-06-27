import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import { SelectorInput } from '@console/internal/components/utils';
import FormSection from '../section/FormSection';

const LabelSection: React.FC = () => {
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const labels = SelectorInput.arrayify(values.labels);

  return (
    <FormSection title="Labels" subTitle="Each label is applied to each created resource." divider>
      <SelectorInput
        onChange={(val) => setFieldValue('labels', SelectorInput.objectify(val))}
        tags={labels}
      />
    </FormSection>
  );
};

export default LabelSection;
