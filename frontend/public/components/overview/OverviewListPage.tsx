import type { FC } from 'react';
import TopologyPage from '@console/topology/src/components/page/TopologyPage';
import { TopologyViewType } from '@console/topology/src/topology-types';

export const OverviewListPage: FC = () => {
  return <TopologyPage hideProjects defaultViewType={TopologyViewType.list} />;
};
