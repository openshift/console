import * as React from 'react';
import { FormSection, TextInputTypes } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { InputField } from '@console/shared';

const ImageSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <FormSection>
      <InputField
        type={TextInputTypes.text}
        name="advancedOptions.image"
        label={t('console-app~Image')}
        helpText={t('console-app~Set custom image for the terminal.')}
      />
    </FormSection>
  );
};

export default ImageSection;
