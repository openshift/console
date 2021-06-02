import * as React from 'react';
import { Text, TextContent } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

export const LocalVolumeSetHeader: React.FC<LocalVolumeSetHeaderProps> = ({
  className,
  variant,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <TextContent>
        <Text component={variant} className={className}>
          {t('lso-plugin~Local Volume Set')}
        </Text>
      </TextContent>
      <p className="help-block">
        {t(
          'lso-plugin~A Local Volume Set allows you to filter a set of disks, group them and create a dedicated StorageClass to consume storage from them.',
        )}
      </p>
    </>
  );
};

type LocalVolumeSetHeaderProps = {
  variant: any;
  className?: string;
};
