import type { FC, ReactNode } from 'react';
import { FormFieldGroupExpandable, FormFieldGroupHeader } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

interface AdvancedConfigurationProps {
  children?: ReactNode;
}

export const AdvancedConfiguration: FC<AdvancedConfigurationProps> = ({ children }) => {
  const { t } = useTranslation('public');
  return (
    <FormFieldGroupExpandable
      header={
        <FormFieldGroupHeader
          titleText={{
            text: t('Advanced configuration'),
            id: 'advanced-configuration-id',
          }}
        />
      }
      data-test="advanced-configuration"
      toggleAriaLabel={t('Advanced configuration')}
    >
      {children}
    </FormFieldGroupExpandable>
  );
};
