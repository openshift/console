import type { FC } from 'react';
import { OLMV0_INSTALLED_TAB } from '@console/operator-lifecycle-manager/src/const';
import { InstalledOperatorsTabbedPage } from './InstalledOperatorsTabbedPage';

export const ClassicInstalledOperatorsRoutePage: FC = () => (
  <InstalledOperatorsTabbedPage activeTab={OLMV0_INSTALLED_TAB} />
);
