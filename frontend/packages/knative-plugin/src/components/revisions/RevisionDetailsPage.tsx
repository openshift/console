import * as React from 'react';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { getRevisionActions } from '../../actions/getRevisionActions';

const RevisionsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const pages = [navFactory.details(DetailsForKind(props.kind)), navFactory.editYaml()];
  const menuActionsCreator = (kindObj: K8sKind, obj: K8sResourceKind) =>
    getRevisionActions().map((action) => action(kindObj, obj));

  return <DetailsPage {...props} pages={pages} menuActions={menuActionsCreator} />;
};

export default RevisionsPage;
