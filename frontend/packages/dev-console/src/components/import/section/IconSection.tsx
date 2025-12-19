import type { FC } from 'react';
import { FormGroup, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import { useFormikContext, useField } from 'formik';
import { useTranslation } from 'react-i18next';
import IconDropdown from '../icon/IconDropdown';
import FormSection from './FormSection';

const IconSection: FC = () => {
  const { t } = useTranslation();
  const [runtimeIconField] = useField<string>('runtimeIcon');
  const [customIconField] = useField<string>('customIcon');
  const formik = useFormikContext<{ runtimeIcon: string }>();

  const onChanged = (value: string) => {
    formik.setFieldValue('runtimeIcon', value);
    formik.setFieldTouched('runtimeIcon');
  };

  const onCustomIconChanged = (url: string) => {
    formik.setFieldValue('customIcon', url);
    formik.setFieldTouched('customIcon');
  };

  return (
    <FormSection>
      <FormGroup fieldId="runtimeIcon" label={t('devconsole~Runtime icon')}>
        <IconDropdown
          runtimeIcon={runtimeIconField.value}
          onRuntimeIconChanged={onChanged}
          customIcon={customIconField.value}
          onCustomIconChanged={onCustomIconChanged}
        />

        <FormHelperText>
          <HelperText>
            <HelperTextItem>
              {t(
                'devconsole~The icon represents your Image in Topology view. A label or annotation will also be added to the resource defining the icon.',
              )}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>
    </FormSection>
  );
};

export default IconSection;
