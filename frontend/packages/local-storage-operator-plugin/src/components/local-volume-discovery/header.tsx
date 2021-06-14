import * as React from 'react';
import { Text, TextContent } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

export const LocalVolumeDiscoveryHeader: React.FC<LocalVolumeDiscoveryHeaderProps> = ({
  className,
  variant,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <TextContent>
        <Text component={variant} className={className}>
          {t('lso-plugin~Local Volume Discovery')}
        </Text>
      </TextContent>
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
