import type { FC } from 'react';
import { DetailsForKind } from '@console/internal/components/default-resource';
import type { DetailsPageProps } from '@console/internal/components/factory';
import { DetailsPage } from '@console/internal/components/factory';
import type { Page } from '@console/internal/components/utils';
import { navFactory } from '@console/internal/components/utils';
import { useClusterBuildStrategyModel, useShipwrightBreadcrumbsFor } from '../../utils';

const ClusterBuildStrategyPage: FC<DetailsPageProps> = (props) => {
  const model = useClusterBuildStrategyModel();
  const breadcrumbs = useShipwrightBreadcrumbsFor(model);
  const pages: Page[] = [navFactory.details(DetailsForKind), navFactory.editYaml()];

  return <DetailsPage {...props} pages={pages} breadcrumbsFor={() => breadcrumbs} />;
};

export default ClusterBuildStrategyPage;
