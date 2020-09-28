import * as React from 'react';
import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { SidebarSectionHeading } from '@console/internal/components/utils';
import { getKnativeRoutesLinks, groupTrafficByRevision } from '../../utils/resource-overview-utils';
import RoutesOverviewListItem from './RoutesOverviewListItem';
import { RoutesOverviewListItem as routeLinkProps } from '../../types';
import { ServiceModel } from '../../models';
import KSRoutes from './KSRoutes';

export type RoutesOverviewListProps = {
  ksroutes: K8sResourceKind[];
  resource: K8sResourceKind;
};

const RoutesOverviewList: React.FC<RoutesOverviewListProps> = ({ ksroutes, resource }) => (
  <>
    <SidebarSectionHeading text="Routes" />
    {_.isEmpty(ksroutes) ? (
      <span className="text-muted">No Routes found for this resource.</span>
    ) : (
      <ul className="list-group">
        {_.map(ksroutes, (route) => {
          const routeLinks: routeLinkProps[] = getKnativeRoutesLinks(route, resource);
          if (resource.kind === ServiceModel.kind) {
            return <KSRoutes key={route.metadata.uid} route={route} />;
          }
          if (routeLinks.length > 0) {
            const { urls: uniqueRoutes, percent: totalPercentage } = groupTrafficByRevision(
              route,
              resource,
            );
            return (
              <RoutesOverviewListItem
                key={route.metadata.uid}
                uniqueRoutes={uniqueRoutes}
                totalPercent={totalPercentage}
                routeLink={routeLinks[0]}
              />
            );
          }
          return null;
        })}
      </ul>
    )}
  </>
);

export default RoutesOverviewList;
