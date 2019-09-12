import * as React from 'react';
import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { SidebarSectionHeading } from '@console/internal/components/utils';
import { OverviewItem } from '@console/internal/components/overview';
import ConfigurationsOverviewList from './ConfigurationsOverviewList';
import { RevisionsOverviewListAlpha, RevisionsOverviewListBeta } from './RevisionsOverviewList';
import { RoutesOverviewListAlpha, RoutesOverviewListBeta } from './RoutesOverviewList';

export type KnativeOverviewProps = {
  ksroutes: K8sResourceKind[];
  configurations: K8sResourceKind[];
  revisions: K8sResourceKind[];
};

export type OverviewDetailsResourcesTabProps = {
  item: OverviewItem;
};

export const OverviewDetailsKnativeResourcesTabAlpha: React.FC<
  OverviewDetailsResourcesTabProps
> = ({ item: { ksroutes, revisions, configurations } }) => (
  <div className="overview__sidebar-pane-body">
    <KnativeOverviewAlpha
      ksroutes={ksroutes}
      configurations={configurations}
      revisions={revisions}
    />
  </div>
);

const KnativeOverviewAlpha: React.FC<KnativeOverviewProps> = ({
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
        <RevisionsOverviewListAlpha revisions={revisions} />
      )}

      <SidebarSectionHeading text="Routes" />
      {_.isEmpty(ksroutes) ? (
        <span className="text-muted">No Routes found for this resource.</span>
      ) : (
        <RoutesOverviewListAlpha ksroutes={ksroutes} />
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

export const OverviewDetailsKnativeResourcesTabBeta: React.FC<OverviewDetailsResourcesTabProps> = ({
  item: { ksroutes, revisions, configurations },
}) => (
  <div className="overview__sidebar-pane-body">
    <KnativeOverviewBeta
      ksroutes={ksroutes}
      configurations={configurations}
      revisions={revisions}
    />
  </div>
);

const KnativeOverviewBeta: React.FC<KnativeOverviewProps> = ({
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
        <RevisionsOverviewListBeta revisions={revisions} />
      )}

      <SidebarSectionHeading text="Routes" />
      {_.isEmpty(ksroutes) ? (
        <span className="text-muted">No Routes found for this resource.</span>
      ) : (
        <RoutesOverviewListBeta ksroutes={ksroutes} />
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
