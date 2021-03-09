import * as React from 'react';
import { match as RMatch } from 'react-router';
import { STORAGE_PREFIX } from '@console/shared';
import TopologyPage from '@console/topology/src/components/page/TopologyPage';
import { TopologyViewType } from '@console/topology/src/topology-types';

type OverviewListPageProps = {
  match: RMatch<{
    name?: string;
  }>;
};

const LAST_TOPOLOGY_WORKLOADS_VIEW_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/last-topology-workloads-view`;

export const OverviewListPage: React.FC<OverviewListPageProps> = ({ match }) => {
  return (
    <TopologyPage
      match={match}
      hideProjects
      activeViewStorageKey={LAST_TOPOLOGY_WORKLOADS_VIEW_LOCAL_STORAGE_KEY}
      defaultViewType={TopologyViewType.list}
    />
  );
};
