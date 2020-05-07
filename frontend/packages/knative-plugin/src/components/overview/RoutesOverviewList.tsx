import * as React from 'react';
import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { SidebarSectionHeading } from '@console/internal/components/utils';
import { getKnativeRoutesLinks } from '../../utils/resource-overview-utils';
import RoutesOverviewListItem from './RoutesOverviewListItem';

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
          const routeLinks = getKnativeRoutesLinks(route, resource);
          return routeLinks.map((routeLink) => (
            <RoutesOverviewListItem key={routeLink.uid} routeLink={routeLink} />
          ));
        })}
      </ul>
    )}
  </>
);

export default RoutesOverviewList;
