import type { FC } from 'react';
import { CLASSIC_INSTALLED_TAB } from '@console/operator-lifecycle-manager/src/const';
import InstalledOperatorsTabbedPage from './InstalledOperatorsTabbedPage';

const ClassicInstalledOperatorsRoutePage: FC = () => (
  <InstalledOperatorsTabbedPage activeTab={CLASSIC_INSTALLED_TAB} />
);

export { ClassicInstalledOperatorsRoutePage };
