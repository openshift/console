import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bullseye,
  Spinner,
  Flex,
  FlexItem,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import './create-storage-system.scss';

export const ErrorHandler: React.FC<WizardStepProps> = ({
  children,
  error,
  loaded,
  loadingMessage,
  errorMessage,
}) => {
  const { t } = useTranslation();

  if (!loaded && !error) {
    return (
      <Bullseye className="odf-create-storage-system-wizard-body">
        <Flex direction={{ default: 'column' }}>
          <FlexItem alignSelf={{ default: 'alignSelfCenter' }}>
            <Spinner />
          </FlexItem>
          <FlexItem>
            {loadingMessage && (
              <TextContent>
                <Text>{loadingMessage}</Text>
              </TextContent>
            )}
          </FlexItem>
        </Flex>
      </Bullseye>
    );
  }

  if (error) {
    return (
      <Bullseye className="odf-create-storage-system-wizard-body">
        <TextContent>
          <Text className="odf-create-storage-system-wizard-body__error" component={TextVariants.p}>
            {errorMessage ||
              t('ceph-storage-plugin~An error has occurred: {{error}}', { error: error?.message })}
          </Text>
        </TextContent>
      </Bullseye>
    );
  }

  return children;
};

type WizardStepProps = {
  children: React.ReactElement;
  loaded: boolean;
  error: any;
  loadingMessage?: string;
  errorMessage?: React.ReactElement;
};
