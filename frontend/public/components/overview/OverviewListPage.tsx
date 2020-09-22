import * as React from 'react';
import { useParams } from 'react-router-dom';
import DataModelProvider from '@console/dev-console/src/components/topology/data-transforms/DataModelProvider';
import { TopologyDataRenderer } from '@console/dev-console/src/components/topology/TopologyDataRenderer';

export const OverviewListPage: React.FC = () => {
  const namespace = useParams().name;
  return (
    <DataModelProvider namespace={namespace}>
      <TopologyDataRenderer showGraphView={false} />
    </DataModelProvider>
  );
};
