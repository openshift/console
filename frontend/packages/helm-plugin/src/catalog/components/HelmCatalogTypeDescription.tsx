import * as React from 'react';
import { QuickStartContextValues, QuickStartContext } from '@patternfly/quickstarts';
import { Trans } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { isModifiedEvent } from '@console/shared/src';

const HelmCatalogTypeDescription: React.FC = () => {
  const { setActiveQuickStart } = React.useContext<QuickStartContextValues>(QuickStartContext);
  const { pathname, search } = useLocation();
  const queryParams = new URLSearchParams(search);
  queryParams.set('quickstart', 'install-helmchartrepo-ns');

  const to = {
    pathname,
    search: `?${queryParams.toString()}`,
  };

  const handleOnClick = (event: React.MouseEvent<HTMLElement>) => {
    if (isModifiedEvent(event)) {
      return;
    }
    setActiveQuickStart('install-helmchartrepo-ns');
  };

  return (
    <Trans ns="helm-plugin">
      Browse for charts that help manage complex installations and upgrades. Cluster administrators
      can customize the content made available in the catalog. Alternatively, developers can try{' '}
      <Link to={to} onClick={handleOnClick}>
        this quick start
      </Link>{' '}
      to configure their own custom Helm Chart repository.
    </Trans>
  );
};

export default HelmCatalogTypeDescription;
