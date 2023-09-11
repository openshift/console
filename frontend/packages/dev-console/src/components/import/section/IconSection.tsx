import * as React from 'react';
import { FormGroup, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
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
      <FormGroup fieldId="runtimeIcon" label={t('devconsole~Runtime icon')}>
        <IconDropdown
          placeholder={t('devconsole~Select an icon')}
          value={field.value}
          onChanged={onChanged}
        />

        <FormHelperText>
          <HelperText>
            <HelperTextItem>
              {t(
                'devconsole~The icon represents your Image in Topology view. A label will also be added to the resource defining the icon.',
              )}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>
    </FormSection>
  );
};

export default IconSection;
