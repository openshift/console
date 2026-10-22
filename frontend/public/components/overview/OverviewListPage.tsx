import type { FC } from 'react';
// eslint-disable-next-line import/no-cycle -- pre-existing cycle with the dev-console project list pages
import { TopologyPage } from '@console/topology/src/components/page/TopologyPage';
import { TopologyViewType } from '@console/topology/src/topology-types';

export const OverviewListPage: FC = () => (
  <TopologyPage hideProjects defaultViewType={TopologyViewType.list} />
);
