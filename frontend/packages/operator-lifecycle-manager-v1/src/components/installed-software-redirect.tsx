import type { FC } from 'react';
import { Navigate, useLocation, useParams } from 'react-router';
import {
  CLASSIC_INSTALLED_TAB,
  INSTALLED_OPERATORS_PATH,
} from '@console/operator-lifecycle-manager/src/const';

/**
 * Legacy Installed Software routes redirect into the tabbed page. Its olmv0-operators tab
 * redirects to the Classic tab, everything else to the default Next-Gen tab.
 */
const InstalledSoftwareRedirect: FC = () => {
  const { ns, '*': tab } = useParams<{ ns?: string; '*'?: string }>();
  const { search, hash } = useLocation();
  const namespaceSegment = ns ? `ns/${ns}` : 'all-namespaces';
  const to = `${INSTALLED_OPERATORS_PATH}/${namespaceSegment}${
    tab === 'olmv0-operators' ? `/${CLASSIC_INSTALLED_TAB}` : ''
  }`;

  return <Navigate to={{ pathname: to, search, hash }} replace />;
};

export default InstalledSoftwareRedirect;
