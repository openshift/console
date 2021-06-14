import * as React from 'react';
import { Alert, Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from '@console/internal/components/utils';
import { STORAGE_CLASS_SUPPORTED_MATRIX_DOC_LINK } from '../../utils/strings';

export const ConfigMapDefaultModesAlert: React.FC<{ isScModesKnown: boolean }> = ({
  isScModesKnown,
}) => {
  const { t } = useTranslation();
  return isScModesKnown ? (
    <Alert
      variant="info"
      isInline
      title={t('kubevirt-plugin~Access and Volume modes should follow storage feature matrix')}
    >
      <ExternalLink
        text={t('kubevirt-plugin~Learn more')}
        href={STORAGE_CLASS_SUPPORTED_MATRIX_DOC_LINK}
      />
    </Alert>
  ) : (
    <Alert variant="warning" isInline title={t('kubevirt-plugin~Warning')}>
      <Stack hasGutter>
        <StackItem>
          {t(
            'kubevirt-plugin~Config map does not contain suggested access and volume modes for the selected storage class',
          )}
        </StackItem>
        <StackItem>
          <ExternalLink
            text={t('kubevirt-plugin~Learn more')}
            href={STORAGE_CLASS_SUPPORTED_MATRIX_DOC_LINK}
          />
        </StackItem>
      </Stack>
    </Alert>
  );
};
