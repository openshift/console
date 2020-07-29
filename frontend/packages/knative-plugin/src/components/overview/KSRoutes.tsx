import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { RoutesOverviewListItem } from '../../types';
import KSRoutesOverviewListItem from './KSRoutesOverviewListItem';
import KSRouteSplitListItem from './KSRouteSplitListItem';

type KSRoutesProps = {
  route: K8sResourceKind;
  routeLinks: RoutesOverviewListItem[];
};

const KSRoutes: React.FC<KSRoutesProps> = ({ route, routeLinks }) => (
  <>
    <KSRoutesOverviewListItem ksroute={route} />
    {routeLinks.map((splitRoute) => (
      <KSRouteSplitListItem key={splitRoute.uid} route={splitRoute} />
    ))}
  </>
);

export default KSRoutes;
