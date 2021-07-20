import * as React from 'react';
import { Text, TextVariants } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from '@console/internal/components/utils';

const SysprepInfo: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div data-test="sysprep-info">
      <Text component={TextVariants.p} className="kv-sysprep-info">
        {t(
          'kubevirt-plugin~Sysprep is an automation tool for Windows that automates Windows installation, setup, and custom software provisioning.',
        )}{' '}
        <ExternalLink
          href="https://kubevirt.io/user-guide/virtual_machines/startup_scripts/#sysprep"
          text={t('kubevirt-plugin~Learn more')}
        />
      </Text>
    </div>
  );
};

export default SysprepInfo;
