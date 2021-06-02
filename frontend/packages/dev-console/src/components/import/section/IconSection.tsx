import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { useFormikContext, useField } from 'formik';
import { useTranslation } from 'react-i18next';
import IconDropdown from '../icon/IconDropdown';
import FormSection from './FormSection';

const IconSection: React.FC = () => {
  const { t } = useTranslation();
  const [field] = useField<string>('runtimeIcon');
  const formik = useFormikContext<{ runtimeIcon: string }>();

  const onChanged = (value: string) => {
    formik.setFieldValue('runtimeIcon', value);
    formik.setFieldTouched('runtimeIcon');
  };

  return (
    <FormSection>
      <FormGroup
        fieldId="runtimeIcon"
        label={t('devconsole~Runtime icon')}
        helperText={t(
          'devconsole~The icon represents your Image in Topology view. A label will also be added to the resource defining the icon.',
        )}
      >
        <IconDropdown
          placeholder={t('devconsole~Select an icon')}
          value={field.value}
          onChanged={onChanged}
        />
      </FormGroup>
    </FormSection>
  );
};

export default IconSection;
