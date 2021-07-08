import * as React from 'react';
import { Text, TextVariants } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { ExternalLink, FieldLevelHelp } from '@console/internal/components/utils';

const SysprepHelperPopup: React.FC = () => {
  const { t } = useTranslation();
  return (
    <FieldLevelHelp testId="sysprep-popover-button">
      <div data-test="sysprep-popover">
        <Trans t={t} ns="kubevirt-plugin">
          <Text component={TextVariants.h6}>Sysprep</Text>
          <Text component={TextVariants.p}>
            Sysprep is an automation tool for Windows that automates Windows installation, setup,
            and custom software provisioning.
          </Text>
          <ExternalLink
            href="https://kubevirt.io/user-guide/virtual_machines/startup_scripts/#sysprep"
            text={t('kubevirt-plugin~Learn more')}
          />
        </Trans>
      </div>
    </FieldLevelHelp>
  );
};

export default SysprepHelperPopup;
