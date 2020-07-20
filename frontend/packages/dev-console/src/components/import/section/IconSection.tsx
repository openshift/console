import * as React from 'react';
import { useFormikContext, useField } from 'formik';
import { FormGroup } from '@patternfly/react-core';

import FormSection from './FormSection';
import IconSelect from '../icon/IconSelect';
import './IconSection.scss';

const IconSection: React.FC = () => {
  const [field] = useField<string>('icon');
  const formik = useFormikContext<{ icon: string }>();

  const onValueSelected = (value: string) => {
    formik.setFieldValue('icon', value);
    formik.setFieldTouched('icon');
  };

  const onClear = () => {
    formik.setFieldValue('icon', formik.initialValues.icon);
    formik.setFieldTouched('icon', false);
  };

  return (
    <div className="icon-section">
      <FormSection>
        <FormGroup
          fieldId="icon"
          label="Runtime Icon"
          helperText="The icon represents your image in Topology view. A label will also be added to the source defining the icon."
          className="asd"
        >
          <IconSelect value={field.value} onValueSelected={onValueSelected} onClear={onClear} />
        </FormGroup>
      </FormSection>
    </div>
  );
};

export default IconSection;
