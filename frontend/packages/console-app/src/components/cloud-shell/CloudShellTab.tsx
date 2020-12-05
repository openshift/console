import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { InlineTechPreviewBadge } from '@console/shared';
import CloudShellTerminal from './CloudShellTerminal';
import './CloudShellTab.scss';

const CloudShellTab: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-cloud-shell-tab__header">
        <div className="co-cloud-shell-tab__header-text">
          {t('cloudshell~OpenShift command line terminal')}
        </div>
        <InlineTechPreviewBadge />
      </div>
      <div className="co-cloud-shell-tab__body">
        <CloudShellTerminal />
      </div>
    </>
  );
};

export default CloudShellTab;
