import * as React from 'react';
import { Label } from '@patternfly/react-core';
import './Badge.scss';
import { useTranslation } from 'react-i18next';

const DevPreviewBadge: React.FC = () => {
  const { t } = useTranslation();
  return <Label className="ocs-preview-badge">{t('badge~Dev preview')}</Label>;
};

export default DevPreviewBadge;
