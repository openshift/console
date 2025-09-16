import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { useFlag } from '@console/shared';
import { FLAG_DEVWORKSPACE } from '../../const';
import { MultiTabbedTerminal } from './MultiTabbedTerminal';

import './CloudShellTab.scss';

const CloudShellTab: React.FCC = () => {
  const { t } = useTranslation('webterminal-plugin');
  const devWorkspaceFlag = useFlag(FLAG_DEVWORKSPACE);

  if (devWorkspaceFlag === false) return <Navigate to="/" replace />;

  return (
    <>
      <div className="co-cloud-shell-tab__header">
        <div className="pf-v6-u-px-sm">{t('OpenShift command line terminal')}</div>
      </div>
      <div className="co-cloud-shell-tab__body">
        <MultiTabbedTerminal />
      </div>
    </>
  );
};

export default CloudShellTab;
