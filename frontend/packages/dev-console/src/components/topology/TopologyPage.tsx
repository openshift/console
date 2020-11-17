import * as React from 'react';
import { match as RMatch } from 'react-router-dom';
import Topology from '@console/topology/src/components/page/TopologyPage';

export interface TopologyPageProps {
  match: RMatch<{
    name?: string;
  }>;
}

const TopologyPage: React.FC<TopologyPageProps> = ({ match }) => {
  return <Topology match={match} />;
};

export default TopologyPage;
