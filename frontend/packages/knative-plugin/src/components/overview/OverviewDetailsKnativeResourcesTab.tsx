import * as React from 'react';
import * as _ from 'lodash';

import { K8sResourceKind } from '@console/internal/module/k8s';
import { SidebarSectionHeading } from '@console/internal/components/utils';
import { OverviewItem } from '@console/internal/components/overview';
import ConfigurationsOverviewList from './ConfigurationsOverviewList';
import RevisionsOverviewList from './RevisionsOverviewList';
import KSRoutesOverviewList from './RoutesOverviewList';

export type KnativeOverviewProps = {
  ksroutes: K8sResourceKind[];
  configurations: K8sResourceKind[];
  revisions: K8sResourceKind[];
};

export type OverviewDetailsResourcesTabProps = {
  item: OverviewItem;
};

const OverviewDetailsKnativeResourcesTab: React.FC<OverviewDetailsResourcesTabProps> = ({
  item: { ksroutes, revisions, configurations },
}) => (
  <div className="overview__sidebar-pane-body">
    <KnativeOverview ksroutes={ksroutes} configurations={configurations} revisions={revisions} />
  </div>
);

const KnativeOverview: React.FC<KnativeOverviewProps> = ({
  ksroutes,
  configurations,
  revisions,
}) => {
  return (
    <React.Fragment>
      <SidebarSectionHeading text="Revisions" />
      {_.isEmpty(revisions) ? (
        <span className="text-muted">No Revisions found for this resource.</span>
      ) : (
        <RevisionsOverviewList revisions={revisions} />
      )}

      <SidebarSectionHeading text="Routes" />
      {_.isEmpty(ksroutes) ? (
        <span className="text-muted">No Routes found for this resource.</span>
      ) : (
        <KSRoutesOverviewList ksroutes={ksroutes} />
      )}

      <SidebarSectionHeading text="Configurations" />
      {_.isEmpty(configurations) ? (
        <span className="text-muted">No Configurations found for this resource.</span>
      ) : (
        <ConfigurationsOverviewList configurations={configurations} />
      )}
    </React.Fragment>
  );
};

export default OverviewDetailsKnativeResourcesTab;
