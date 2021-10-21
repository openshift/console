import * as React from 'react';
import { EmptyState, EmptyStateBody, Title } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';

const HardwareDevicesEmptyState: React.FC<any> = ({ isGPU, vmName }) => {
  const { t } = useTranslation();

  return (
    <EmptyState>
      <Title size="lg" headingLevel="h4">
        {isGPU
          ? t('kubevirt-plugin~No GPU devices found')
          : t('kubevirt-plugin~No Host devices found')}
      </Title>
      <EmptyStateBody>
        {isGPU ? (
          <Trans ns="kubevirt-plugin" t={t}>
            To add a GPU device to <b>{vmName}</b> click the <b>Add GPU device</b> button.
          </Trans>
        ) : (
          <Trans ns="kubevirt-plugin" t={t}>
            To add a host device to <b>{vmName}</b> click the <b>Add Host device</b> button.
          </Trans>
        )}
      </EmptyStateBody>
    </EmptyState>
  );
};

export default HardwareDevicesEmptyState;
