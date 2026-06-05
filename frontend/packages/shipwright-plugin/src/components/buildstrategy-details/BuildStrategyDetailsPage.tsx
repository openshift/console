import * as React from 'react';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { Page, navFactory } from '@console/internal/components/utils';
import { useBuildStrategyModel, useShipwrightBreadcrumbsFor } from '../../utils';

const BuildStrategyPage: React.FC<DetailsPageProps> = (props) => {
  const model = useBuildStrategyModel();
  const breadcrumbs = useShipwrightBreadcrumbsFor(model);
  const pages: Page[] = [navFactory.details(DetailsForKind), navFactory.editYaml()];

  return <DetailsPage {...props} pages={pages} breadcrumbsFor={() => breadcrumbs} />;
};

export default BuildStrategyPage;
