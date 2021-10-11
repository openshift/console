import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Redirect } from 'react-router';
import isMultiClusterEnabled from '@console/app/src/utils/isMultiClusterEnabled';
import { useFlag } from '@console/dynamic-plugin-sdk';
import { InlineTechPreviewBadge } from '@console/shared';
import { FLAG_DEVWORKSPACE } from '../../consts';
import CloudShellTerminal from './CloudShellTerminal';
import './CloudShellTab.scss';

const CloudShellTab: React.FC = () => {
  const { t } = useTranslation();
  const devWorkspaceFlag = useFlag(FLAG_DEVWORKSPACE);

  if (devWorkspaceFlag === false || isMultiClusterEnabled()) return <Redirect to="/" />;

  return (
    <>
      <div className="co-cloud-shell-tab__header">
        <div className="co-cloud-shell-tab__header-text">
          {t('console-app~OpenShift command line terminal')}
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
