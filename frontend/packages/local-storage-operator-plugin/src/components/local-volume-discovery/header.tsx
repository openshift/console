import * as React from 'react';
import { Content } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

export const LocalVolumeDiscoveryHeader: React.FC<LocalVolumeDiscoveryHeaderProps> = ({
  className,
  variant,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <Content>
        <Content component={variant} className={className}>
          {t('lso-plugin~Local Volume Discovery')}
        </Content>
      </Content>
      <p className="help-block">
        {t('lso-plugin~Allows you to discover the available disks on all available nodes')}
      </p>
    </>
  );
};

type LocalVolumeDiscoveryHeaderProps = {
  variant: any;
  className?: string;
};
