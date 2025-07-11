import * as React from 'react';
import { FormFieldGroupExpandable, FormFieldGroupHeader } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

export const AdvancedConfiguration: React.FC = ({ children }) => {
  const { t } = useTranslation();
  return (
    <FormFieldGroupExpandable
      header={
        <FormFieldGroupHeader
          titleText={{
            text: t('public~Advanced configuration'),
            id: 'advanced-configuration-id',
          }}
        />
      }
      data-test="advanced-configuration"
      toggleAriaLabel={t('public~Advanced configuration')}
    >
      {children}
    </FormFieldGroupExpandable>
  );
};
