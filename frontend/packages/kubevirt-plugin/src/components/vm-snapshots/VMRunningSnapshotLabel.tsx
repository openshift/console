import * as React from 'react';
import { Label, Tooltip } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

type VMTemplateLabelProps = {
  isOnlineSnapshot: boolean;
  className?: string;
};

export const VMRunningSnapshotLabel: React.FC<VMTemplateLabelProps> = ({
  isOnlineSnapshot,
  className,
}) => {
  const { t } = useTranslation();

  if (!isOnlineSnapshot) {
    return null;
  }

  return (
    <Tooltip content={t('kubevirt-plugin~This snapshot was created while vm is running')}>
      <Label color="green" className={className} isTruncated>
        {t('kubevirt-plugin~Online snapshot')}
      </Label>
    </Tooltip>
  );
};
