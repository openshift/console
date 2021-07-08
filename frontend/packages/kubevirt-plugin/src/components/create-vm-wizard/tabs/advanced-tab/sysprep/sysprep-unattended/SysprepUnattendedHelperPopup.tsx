import * as React from 'react';
import { Text, TextVariants } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { ExternalLink, FieldLevelHelp } from '@console/internal/components/utils';

const SysprepUnattendedHelperPopup: React.FC = () => {
  const { t } = useTranslation();
  return (
    <FieldLevelHelp testId="sysprep-unattended-popover-button">
      <div data-test="sysprep-unattended-popover">
        <Trans t={t} ns="kubevirt-plugin">
          <Text component={TextVariants.h6}>Unattend.xml</Text>
          <Text component={TextVariants.p}>
            The answer file can be used to modify Windows settings in your images during Setup
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

export default SysprepUnattendedHelperPopup;
