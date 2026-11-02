import type { FC } from 'react';
import { Navigate, useLocation, useParams } from 'react-router';
import {
  OLMV0_INSTALLED_TAB,
  INSTALLED_OPERATORS_PATH,
} from '@console/operator-lifecycle-manager/src/const';

/**
 * Legacy Installed Software routes redirect into the tabbed page. Its olmv0-operators tab
 * redirects to the Classic tab, everything else to the default OLMv1 tab.
 */
export const InstalledSoftwareRedirect: FC = () => {
  const { ns, '*': tab } = useParams<{ ns?: string; '*'?: string }>();
  const { search, hash } = useLocation();
  const namespaceSegment = ns ? `ns/${ns}` : 'all-namespaces';
  const to = `${INSTALLED_OPERATORS_PATH}/${namespaceSegment}${
    tab === 'olmv0-operators' ? `/${OLMV0_INSTALLED_TAB}` : ''
  }`;

  return <Navigate to={{ pathname: to, search, hash }} replace />;
};
