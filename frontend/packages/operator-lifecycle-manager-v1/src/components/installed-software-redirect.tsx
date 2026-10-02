import type { FC } from 'react';
import { Navigate, useParams } from 'react-router';
import {
  CLASSIC_INSTALLED_TAB,
  INSTALLED_OPERATORS_PATH,
} from '@console/operator-lifecycle-manager/src/const';

/**
 * The Installed Software page was folded into Installed Operators. Its olmv0-operators tab
 * redirects to the Classic tab, everything else to the default Next-Gen tab.
 */
const InstalledSoftwareRedirect: FC = () => {
  const { ns, '*': tab } = useParams<{ ns?: string; '*'?: string }>();
  const namespaceSegment = ns ? `ns/${ns}` : 'all-namespaces';
  const to = `${INSTALLED_OPERATORS_PATH}/${namespaceSegment}${
    tab === 'olmv0-operators' ? `/${CLASSIC_INSTALLED_TAB}` : ''
  }`;

  return <Navigate to={to} replace />;
};

export default InstalledSoftwareRedirect;
