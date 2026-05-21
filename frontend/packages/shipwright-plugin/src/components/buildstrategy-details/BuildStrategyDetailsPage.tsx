import type { FC } from 'react';
import { DetailsForKind } from '@console/internal/components/default-resource';
import type { DetailsPageProps } from '@console/internal/components/factory';
import { DetailsPage } from '@console/internal/components/factory';
import type { Page } from '@console/internal/components/utils';
import { navFactory } from '@console/internal/components/utils';
import { useBuildStrategyModel, useShipwrightBreadcrumbsFor } from '../../utils';

const BuildStrategyPage: FC<DetailsPageProps> = (props) => {
  const model = useBuildStrategyModel();
  const breadcrumbs = useShipwrightBreadcrumbsFor(model);
  const pages: Page[] = [navFactory.details(DetailsForKind), navFactory.editYaml()];

  return <DetailsPage {...props} pages={pages} breadcrumbsFor={() => breadcrumbs} />;
};

export default BuildStrategyPage;
