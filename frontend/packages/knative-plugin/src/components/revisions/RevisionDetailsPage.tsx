import * as React from 'react';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { getRevisionActions } from '../../actions/getRevisionActions';
import { useServerlessBreadcrumbsFor } from '../../hooks/useBreadcrumbsFor';

const RevisionDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const { kindObj, match, kind } = props;
  const pages = [navFactory.details(DetailsForKind(kind)), navFactory.editYaml()];
  const breadcrumbsFor = useServerlessBreadcrumbsFor(kindObj, match, 'serving');
  const menuActionsCreator = (kindsObj: K8sKind, obj: K8sResourceKind) =>
    getRevisionActions().map((action) => action(kindsObj, obj));

  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={() => breadcrumbsFor}
      pages={pages}
      menuActions={menuActionsCreator}
    />
  );
};

export default RevisionDetailsPage;
