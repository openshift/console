import type { FC } from 'react';
import { Navigate, useParams } from 'react-router';
import { CLASSIC_INSTALLED_TAB, INSTALLED_OPERATORS_PATH } from '../const';

/**
 * The ClusterServiceVersion list moved to the Classic tab of the Installed Operators page.
 * Preserve the k8s resource URL for bookmarks and existing links.
 */
const InstalledOperatorsRedirect: FC = () => {
  const { ns } = useParams<{ ns?: string }>();
  const namespaceSegment = ns ? `ns/${ns}` : 'all-namespaces';

  return (
    <Navigate
      to={`${INSTALLED_OPERATORS_PATH}/${namespaceSegment}/${CLASSIC_INSTALLED_TAB}`}
      replace
    />
  );
};

export default InstalledOperatorsRedirect;
