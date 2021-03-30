import * as React from 'react';
import { Kebab, navFactory } from '@console/internal/components/utils';
import { DetailsPage } from '@console/internal/components/factory';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { useTabbedTableBreadcrumbsFor } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ServiceModel } from '../../models';
import { serverlessTab } from '../../utils/serverless-tab-utils';
import ServerlessFunctionType from '../overview/ServerlessFunctionType';
import { isServerlessFunction } from '../../topology/knative-topology-utils';

const ServiceDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const { kindObj, match, kind } = props;
  const renderTypeForServerlessFunction = (obj: K8sResourceKind) =>
    isServerlessFunction(obj) ? <ServerlessFunctionType /> : null;
  const pages = [
    navFactory.details(DetailsForKind(kind, renderTypeForServerlessFunction)),
    navFactory.editYaml(),
  ];
  const commonActions = Kebab.factory.common.map((action) => action);
  const menuActionsCreator = [...Kebab.getExtensionsActionsForKind(ServiceModel), ...commonActions];
  const breadcrumbs = useTabbedTableBreadcrumbsFor(
    kindObj,
    match,
    'serving',
    serverlessTab(kindObj.kind),
  );
  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={() => breadcrumbs}
      pages={pages}
      menuActions={menuActionsCreator}
    />
  );
};

export default ServiceDetailsPage;
