import * as React from 'react';
import { useExtensions } from '@console/plugin-sdk';
import { isTopologyDataModelFactory, TopologyDataModelFactory } from '../../extensions/topology';
import { DataModelExtension } from './data-transforms/DataModelExtension';
import { TopologyExtensionLoader } from './TopologyExtensionLoader';

export interface TopologyDataControllerProps {
  showGraphView: boolean;
  namespace: string;
  render(RenderProps): React.ReactElement;
}

export const TopologyDataController: React.FC<TopologyDataControllerProps> = ({
  showGraphView,
  namespace,
  render,
}) => {
  const modelFactories = useExtensions<TopologyDataModelFactory>(isTopologyDataModelFactory);
  return (
    <>
      {modelFactories.map((factory) => (
        <DataModelExtension key={factory.properties.id} dataModelFactory={factory} />
      ))}
      <TopologyExtensionLoader
        render={render}
        namespace={namespace}
        showGraphView={showGraphView}
      />
    </>
  );
};

export default TopologyDataController;
