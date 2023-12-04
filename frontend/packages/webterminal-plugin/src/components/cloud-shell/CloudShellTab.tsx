import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom-v5-compat';
import { useFlag } from '@console/shared';
import { FLAG_DEVWORKSPACE } from '../../const';
import MultiTabTerminal from './MultiTabbedTerminal';

import './CloudShellTab.scss';

const CloudShellTab: React.FC = () => {
  const { t } = useTranslation();
  const devWorkspaceFlag = useFlag(FLAG_DEVWORKSPACE);

  if (devWorkspaceFlag === false) return <Navigate to="/" replace />;

  return (
    <>
      <div className="co-cloud-shell-tab__header">
        <div className="co-cloud-shell-tab__header-text">
          {t('webterminal-plugin~OpenShift command line terminal')}
        </div>
      </div>
      <div className="co-cloud-shell-tab__body">
        <MultiTabTerminal />
      </div>
    </>
  );
};

export default CloudShellTab;
