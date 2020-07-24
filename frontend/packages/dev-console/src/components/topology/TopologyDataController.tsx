import * as React from 'react';
import { connect } from 'react-redux';
import { useExtensions } from '@console/plugin-sdk';
import { isTopologyDataModelFactory, TopologyDataModelFactory } from '../../extensions/topology';
import { RootState } from '@console/internal/redux';
import DataModelProvider from './data-transforms/DataModelProvider';
import { DataModelExtension } from './data-transforms/DataModelExtension';
import { TopologyExtensionLoader } from './TopologyExtensionLoader';

interface StateProps {
  kindsInFlight: boolean;
}

export interface TopologyDataControllerProps extends StateProps {
  namespace: string;
  render(RenderProps): React.ReactElement;
}

export const TopologyDataController: React.FC<TopologyDataControllerProps> = ({
  namespace,
  render,
  kindsInFlight,
}) => {
  const modelFactories = useExtensions<TopologyDataModelFactory>(isTopologyDataModelFactory);

  return (
    <DataModelProvider namespace={namespace}>
      {modelFactories.map((factory) => (
        <DataModelExtension key={factory.properties.id} dataModelFactory={factory} />
      ))}
      <TopologyExtensionLoader
        kindsInFlight={kindsInFlight}
        render={render}
        namespace={namespace}
      />
    </DataModelProvider>
  );
};

const DataControllerStateToProps = (state: RootState) => {
  return {
    kindsInFlight: state.k8s.getIn(['RESOURCES', 'inFlight']),
  };
};

export default connect(DataControllerStateToProps)(TopologyDataController);
