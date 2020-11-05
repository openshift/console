import * as React from 'react';
import { useFormikContext, useField } from 'formik';
import { useTranslation } from 'react-i18next';
import { FormGroup } from '@patternfly/react-core';

import FormSection from './FormSection';
import IconDropdown from '../icon/IconDropdown';

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
        label={t('devconsole~Runtime Icon')}
        helperText={t(
          'devconsole~The icon represents your image in Topology view. A label will also be added to the resource defining the icon.',
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
