import * as React from 'react';
import { QuickStartContextValues, QuickStartContext } from '@patternfly/quickstarts';
import { Trans } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import QuickStartsLoader from '@console/app/src/components/quick-starts/loader/QuickStartsLoader';
import { isModifiedEvent } from '@console/shared/src';

type NamespacedHCRQuickStartInfoProps = {
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  to: { pathname: string; search: string };
};

export const NamespacedHCRQuickStartInfo: React.FC<NamespacedHCRQuickStartInfoProps> = ({
  onClick,
  to,
}) => (
  <Trans ns="helm-plugin">
    {' '}
    Alternatively, developers can try{' '}
    <Link to={to} onClick={onClick}>
      this quick start
    </Link>{' '}
    to configure their own custom Helm Chart repository.
  </Trans>
);

const HelmCatalogTypeDescription: React.FC = () => {
  const NAMESPACED_HELM_CHART_REPO_QUICKSTART_NAME = 'install-helmchartrepo-ns';
  const { pathname, search } = useLocation();
  const { setActiveQuickStart } = React.useContext<QuickStartContextValues>(QuickStartContext);
  const queryParams = new URLSearchParams(search);
  queryParams.set('quickstart', NAMESPACED_HELM_CHART_REPO_QUICKSTART_NAME);

  const to = {
    pathname,
    search: `?${queryParams.toString()}`,
  };

  return (
    <QuickStartsLoader>
      {(quickStarts, loaded) => {
        const handleOnClick = (event: React.MouseEvent<HTMLElement>) => {
          if (isModifiedEvent(event)) {
            return;
          }
          setActiveQuickStart(NAMESPACED_HELM_CHART_REPO_QUICKSTART_NAME);
        };

        const isNamespacedHCRQuickStartAvailable =
          loaded &&
          quickStarts?.length > 0 &&
          !!quickStarts.find(
            (qs) => qs.metadata.name === NAMESPACED_HELM_CHART_REPO_QUICKSTART_NAME,
          );

        return (
          <>
            <Trans ns="helm-plugin">
              Browse for charts that help manage complex installations and upgrades. Cluster
              administrators can customize the content made available in the catalog.
            </Trans>
            {isNamespacedHCRQuickStartAvailable && (
              <NamespacedHCRQuickStartInfo
                data-test-id="namespaced-hcr-quickstart-link"
                to={to}
                onClick={handleOnClick}
              />
            )}
          </>
        );
      }}
    </QuickStartsLoader>
  );
};

export default HelmCatalogTypeDescription;
