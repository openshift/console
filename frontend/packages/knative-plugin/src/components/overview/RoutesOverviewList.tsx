import * as React from 'react';
import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { SidebarSectionHeading } from '@console/internal/components/utils';
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
        {_.map(ksroutes, (route) => (
          <RoutesOverviewListItem key={route.metadata.uid} route={route} resource={resource} />
        ))}
      </ul>
    )}
  </>
);

export default RoutesOverviewList;
