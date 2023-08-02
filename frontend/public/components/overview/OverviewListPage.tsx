import * as React from 'react';
import { STORAGE_PREFIX } from '@console/shared';
import TopologyPage from '@console/topology/src/components/page/TopologyPage';
import { TopologyViewType } from '@console/topology/src/topology-types';

const LAST_TOPOLOGY_WORKLOADS_VIEW_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/last-topology-workloads-view`;

export const OverviewListPage: React.FC = () => {
  return (
    <TopologyPage
      hideProjects
      activeViewStorageKey={LAST_TOPOLOGY_WORKLOADS_VIEW_LOCAL_STORAGE_KEY}
      defaultViewType={TopologyViewType.list}
    />
  );
};
