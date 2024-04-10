import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from '@console/internal/components/utils';

import './ApprovalToastContent.scss';

interface ApprovalToastContentProps {
  type: string;
  uniquePipelineRuns: number;
  devconsolePath?: string;
  adminconsolePath?: string;
}

const ApprovalToastContent: React.FC<ApprovalToastContentProps> = ({
  type,
  uniquePipelineRuns,
  devconsolePath,
  adminconsolePath,
}) => {
  const { t } = useTranslation();
  if (type === 'current') {
    return (
      <>
        {t('pipelines-plugin~Your approval has been requested on {{plrs}} pipeline', {
          plrs: uniquePipelineRuns,
        })}
        {uniquePipelineRuns > 1 ? t('pipelines-plugin~runs.') : t('pipelines-plugin~run.')}
        <p className="odc-pl-approval-toast__link">
          <ExternalLink href={devconsolePath} text={t('pipelines-plugin~Go to Approvals tab')} />
        </p>
      </>
    );
  }
  if (type === 'other') {
    return (
      <>
        {t('pipelines-plugin~Your approval has been requested on {{plrs}} pipeline', {
          plrs: uniquePipelineRuns,
        })}
        {uniquePipelineRuns > 1
          ? t('pipelines-plugin~runs in other namespaces.')
          : t('pipelines-plugin~run in other namespaces.')}
        <p className="odc-pl-approval-toast__link">
          <ExternalLink
            href={adminconsolePath}
            text={t('pipelines-plugin~Go to Admin Approvals tab')}
          />
        </p>
      </>
    );
  }
  return null;
};

export default ApprovalToastContent;
