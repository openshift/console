import * as React from 'react';
import { connect } from 'react-redux';
import { match as RMatch } from 'react-router';
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
  match: RMatch<{
    name?: string;
  }>;
  render(RenderProps): React.ReactElement;
}

export const TopologyDataController: React.FC<TopologyDataControllerProps> = ({
  match,
  render,
  kindsInFlight,
}) => {
  const namespace = match.params.name;
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
