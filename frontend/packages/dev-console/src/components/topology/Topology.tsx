import * as React from 'react';
import { TopologyView } from '@patternfly/react-topology';
import { nodeProvider, edgeProvider, groupProvider } from './shape-providers';
import Graph from './Graph';
import { GraphApi, TopologyDataModel, TopologyDataObject } from './topology-types';
import { updateTopologyResourceApplication } from './topology-utils';
import TopologyControlBar from './TopologyControlBar';
import TopologySideBar from './TopologySideBar';

export interface TopologyProps {
  data: TopologyDataModel;
}

const Topology: React.FC<TopologyProps> = (props) => {
  const {
    data: { graph, topology },
  } = props;

  const [selected, setSelected] = React.useState(null);
  const [graphApi, setGraphApi] = React.useState(null);

  React.useEffect(() => {
    if (selected && !topology[selected]) {
      setSelected(null);
    }
  }, [selected, topology]);

  const onSelect = (nodeId: string) => {
    setSelected(!nodeId || selected === nodeId ? null : nodeId);
  };

  const onUpdateNodeGroup = (nodeId: string, targetGroup: string): Promise<any> => {
    const item: TopologyDataObject = topology[nodeId];

    return updateTopologyResourceApplication(item, targetGroup);
  };

  const onSidebarClose = () => {
    setSelected(null);
  };

  const graphApiRef = (api: GraphApi) => {
    setGraphApi(api);
  };

  const topologySideBar = (
    <TopologySideBar
      item={selected ? topology[selected] : null}
      show={!!selected}
      onClose={onSidebarClose}
    />
  );

  return (
    <TopologyView
      controlBar={<TopologyControlBar graphApi={graphApi} />}
      sideBar={topologySideBar}
      sideBarOpen={!!selected}
    >
      <Graph
        graph={graph}
        topology={topology}
        nodeProvider={nodeProvider}
        edgeProvider={edgeProvider}
        groupProvider={groupProvider}
        selected={selected}
        onSelect={onSelect}
        onUpdateNodeGroup={onUpdateNodeGroup}
        graphApiRef={graphApiRef}
      />
    </TopologyView>
  );
};

export default Topology;
