import { useTranslation } from 'react-i18next';
import { MultiTabbedTerminal } from './MultiTabbedTerminal';

import './CloudShellTab.scss';

const CloudShellTab: React.FCC = () => {
  const { t } = useTranslation('webterminal-plugin');

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
