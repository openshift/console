import * as React from 'react';
import { Text, TextVariants } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { ExternalLink, FieldLevelHelp } from '@console/internal/components/utils';

const SysprepAutounattendHelperPopup: React.FC = () => {
  const { t } = useTranslation();
  return (
    <FieldLevelHelp testId="sysprep-autounattend-popover-button">
      <div data-test="sysprep-autounattend-popover">
        <Trans t={t} ns="kubevirt-plugin">
          <Text component={TextVariants.h6}>Autounattend.xml</Text>
          <Text component={TextVariants.p}>
            Autounattend will be picked up automatically during windows installation. it can be used
            with destructive actions such as disk formatting. Autounattend will only be used once
            during installation.
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

export default SysprepAutounattendHelperPopup;
