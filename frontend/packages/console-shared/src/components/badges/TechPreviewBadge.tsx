import type { FC } from 'react';
import { Label } from '@patternfly/react-core';
import './Badge.scss';
import { useTranslation } from 'react-i18next';

export const TechPreviewBadge: FC = () => {
  const { t } = useTranslation('console-shared');
  return <Label className="ocs-preview-badge">{t('Tech preview')}</Label>;
};
