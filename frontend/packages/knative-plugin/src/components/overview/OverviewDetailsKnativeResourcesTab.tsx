import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { OverviewItem } from '@console/shared';
import { RevisionModel, ServiceModel } from '../../models';
import ConfigurationsOverviewList from './ConfigurationsOverviewList';
import RevisionsOverviewList from './RevisionsOverviewList';
import KSRoutesOverviewList from './RoutesOverviewList';

export type KnativeOverviewProps = {
  ksroutes: K8sResourceKind[];
  configurations: K8sResourceKind[];
  revisions: K8sResourceKind[];
  obj: K8sResourceKind;
};
export type KnativeRevisionResourceProps = {
  ksroutes: K8sResourceKind[];
  configurations: K8sResourceKind[];
};
export type KnativeServiceResourceProps = {
  obj: K8sResourceKind;
  revisions: K8sResourceKind[];
  ksroutes: K8sResourceKind[];
};
export type OverviewDetailsResourcesTabProps = {
  item: OverviewItem;
};

const getSidebarResources = ({ obj, ksroutes, revisions, configurations }: OverviewItem) => {
  switch (obj.kind) {
    case RevisionModel.kind:
      return <KnativeRevisionResources ksroutes={ksroutes} configurations={configurations} />;
    case ServiceModel.kind:
      return <KnativeServicesResources ksroutes={ksroutes} obj={obj} revisions={revisions} />;
    default:
      return (
        <KnativeOverview
          ksroutes={ksroutes}
          revisions={revisions}
          configurations={configurations}
          obj={obj}
        />
      );
  }
};
const OverviewDetailsKnativeResourcesTab: React.FC<OverviewDetailsResourcesTabProps> = ({
  item,
}) => <div className="overview__sidebar-pane-body"> {getSidebarResources(item)} </div>;

const KnativeRevisionResources: React.FC<KnativeRevisionResourceProps> = ({
  ksroutes,
  configurations,
}) => {
  return (
    <>
      <KSRoutesOverviewList ksroutes={ksroutes} />
      <ConfigurationsOverviewList configurations={configurations} />
    </>
  );
};

const KnativeServicesResources: React.FC<KnativeServiceResourceProps> = ({
  revisions,
  ksroutes,
  obj,
}) => {
  return (
    <>
      <RevisionsOverviewList revisions={revisions} service={obj} />
      <KSRoutesOverviewList ksroutes={ksroutes} />
    </>
  );
};

const KnativeOverview: React.FC<KnativeOverviewProps> = ({
  ksroutes,
  configurations,
  revisions,
  obj,
}) => {
  return (
    <>
      <RevisionsOverviewList revisions={revisions} service={obj} />
      <KSRoutesOverviewList ksroutes={ksroutes} />
      <ConfigurationsOverviewList configurations={configurations} />
    </>
  );
};

export default OverviewDetailsKnativeResourcesTab;
