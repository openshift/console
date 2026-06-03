import * as React from 'react';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { Page, navFactory } from '@console/internal/components/utils';
import { useClusterBuildStrategyModel, useShipwrightBreadcrumbsFor } from '../../utils';

const ClusterBuildStrategyPage: React.FC<DetailsPageProps> = (props) => {
  const model = useClusterBuildStrategyModel();
  const breadcrumbs = useShipwrightBreadcrumbsFor(model);
  const pages: Page[] = [navFactory.details(DetailsForKind), navFactory.editYaml()];

  return <DetailsPage {...props} pages={pages} breadcrumbsFor={() => breadcrumbs} />;
};

export default ClusterBuildStrategyPage;
