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
      return (
        <Label icon={<GreenCheckCircleIcon />} isTruncated>
          {t('gitops-plugin~Synced')}
        </Label>
      );
    case 'OutOfSync':
      return (
        <Label icon={<YellowExclamationTriangleIcon />} isTruncated>
          {t('gitops-plugin~OutOfSync')}
        </Label>
      );
    case 'Unknown':
      return (
        <Label icon={<GrayUnknownIcon />} isTruncated>
          {t('gitops-plugin~Unknown')}
        </Label>
      );
    default:
      return null;
  }
};

export default GitOpsRenderStatusLabel;
