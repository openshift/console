import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Bullseye, Spinner, Text, TextContent, TextVariants } from '@patternfly/react-core';
import './create-storage-system.scss';

export const ErrorHandler: React.FC<WizardStepProps> = ({ children, error, loaded }) => {
  const { t } = useTranslation();

  if (!loaded) {
    return (
      <Bullseye className="odf-create-storage-system-wizard-body">
        <Spinner />
      </Bullseye>
    );
  }

  if (error) {
    return (
      <Bullseye className="odf-create-storage-system-wizard-body">
        <TextContent>
          <Text className="odf-create-storage-system-wizard-body__error" component={TextVariants.p}>
            {t('ceph-storage-plugin~An error has occurred: {{error}}', { error: error?.message })}
          </Text>
        </TextContent>
      </Bullseye>
    );
  }

  return children;
};

type WizardStepProps = {
  children: React.ReactElement;
  error: any;
  loaded: boolean;
};
