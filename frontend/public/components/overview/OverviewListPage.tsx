import * as React from 'react';
import { useParams } from 'react-router-dom';
import { renderTopology } from '@console/dev-console/src/components/topology/TopologyPage';
import ConnectedTopologyDataController from '@console/dev-console/src/components/topology/TopologyDataController';
import DataModelProvider from '@console/dev-console/src/components/topology/data-transforms/DataModelProvider';

export const OverviewListPage: React.FC = () => {
  const namespace = useParams().name;
  return (
    <DataModelProvider namespace={namespace}>
      <ConnectedTopologyDataController
        showGraphView={false}
        render={renderTopology}
        namespace={namespace}
      />
    </DataModelProvider>
  );
};
