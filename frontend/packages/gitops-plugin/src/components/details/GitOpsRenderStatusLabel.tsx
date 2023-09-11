import * as React from 'react';
import { Label } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  GreenCheckCircleIcon,
  YellowExclamationTriangleIcon,
  GrayUnknownIcon,
} from '@console/shared';

interface GitOpsRenderStatusLabelProps {
  status: string;
}

const GitOpsRenderStatusLabel: React.FC<GitOpsRenderStatusLabelProps> = ({ status }) => {
  const { t } = useTranslation();
  switch (status) {
    case 'Synced':
      return <Label icon={<GreenCheckCircleIcon />}>{t('gitops-plugin~Synced')}</Label>;
    case 'OutOfSync':
      return <Label icon={<YellowExclamationTriangleIcon />}>{t('gitops-plugin~OutOfSync')}</Label>;
    case 'Unknown':
      return <Label icon={<GrayUnknownIcon />}>{t('gitops-plugin~Unknown')}</Label>;
    default:
      return null;
  }
};

export default GitOpsRenderStatusLabel;
