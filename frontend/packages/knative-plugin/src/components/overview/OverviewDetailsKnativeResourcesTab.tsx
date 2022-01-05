import * as React from 'react';
import OperatorBackedOwnerReferences from '@console/internal/components/utils';
import { KnativeServiceOverviewItem } from '../../topology/topology-types';
import ConfigurationsOverviewList from './ConfigurationsOverviewList';
import RevisionsOverviewList from './RevisionsOverviewList';
import KSRoutesOverviewList from './RoutesOverviewList';

type OverviewDetailsResourcesTabProps = {
  item: KnativeServiceOverviewItem;
};

const getSidebarResources = (item: KnativeServiceOverviewItem) => {
  const { obj, ksroutes, revisions, configurations } = item;

  return (
    <>
      <RevisionsOverviewList revisions={revisions} service={obj} />
      <KSRoutesOverviewList ksroutes={ksroutes} resource={obj} />
      <ConfigurationsOverviewList configurations={configurations} />
    </>
  );
};

const OverviewDetailsKnativeResourcesTab: React.FC<OverviewDetailsResourcesTabProps> = ({
  item,
}) => (
  <div className="overview__sidebar-pane-body">
    <OperatorBackedOwnerReferences item={item} />
    {getSidebarResources(item)}
  </div>
);

export default OverviewDetailsKnativeResourcesTab;
