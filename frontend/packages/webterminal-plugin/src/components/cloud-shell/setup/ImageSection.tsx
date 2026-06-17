import type { FC } from 'react';
import { FormSection, TextInputTypes } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { InputField } from '@console/shared/src/components/formik-fields/InputField';

const ImageSection: FC = () => {
  const { t } = useTranslation('webterminal-plugin');

  return (
    <FormSection>
      <InputField
        type={TextInputTypes.text}
        name="advancedOptions.image"
        label={t('Image')}
        helpText={t('Set custom image for the terminal.')}
      />
    </FormSection>
  );
};

export default ImageSection;
