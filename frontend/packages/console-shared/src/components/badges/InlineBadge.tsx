import type { FC } from 'react';
import { Badge } from '@patternfly/react-core';
import './Badge.scss';
import { useTranslation } from 'react-i18next';

export const InlineTechPreviewBadge: FC = () => {
  const { t } = useTranslation();
  return (
    <Badge className="ocs-badge__inline" isRead>
      {t('console-shared~Tech preview')}
    </Badge>
  );
};

export const InlineDevPreviewBadge: FC = () => {
  const { t } = useTranslation();
  return (
    <Badge className="ocs-badge__inline" isRead>
      {t('console-shared~Dev preview')}
    </Badge>
  );
};
