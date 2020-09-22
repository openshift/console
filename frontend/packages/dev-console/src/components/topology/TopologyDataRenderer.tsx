import * as React from 'react';
import { observer } from '@patternfly/react-topology';
import { HintBlock, StatusBox } from '@console/internal/components/utils';
import ModelContext, { ExtensibleModel } from './data-transforms/ModelContext';
import { ConnectedTopologyView } from './TopologyView';
import EmptyState from '../EmptyState';

interface TopologyDataRendererProps {
  showGraphView: boolean;
}

const EmptyMsg = () => (
  <EmptyState
    title="Topology"
    hintBlock={
      <HintBlock title="No resources found">
        <p>
          To add content to your project, create an application, component or service using one of
          these options.
        </p>
      </HintBlock>
    }
  />
);

export const TopologyDataRenderer: React.FC<TopologyDataRendererProps> = observer(
  ({ showGraphView }) => {
    const dataModelContext = React.useContext<ExtensibleModel>(ModelContext);
    const { namespace, model, loaded, loadError } = dataModelContext;

    const skeletonOverview = (
      <div className="skeleton-overview">
        <div className="skeleton-overview--head" />
        <div className="skeleton-overview--tile" />
        <div className="skeleton-overview--tile" />
        <div className="skeleton-overview--tile" />
      </div>
    );
    return (
      <StatusBox
        skeleton={showGraphView ? undefined : skeletonOverview}
        data={model ? model.nodes : null}
        label="Topology"
        loaded={loaded}
        loadError={loadError}
        EmptyMsg={EmptyMsg}
      >
        <ConnectedTopologyView showGraphView={showGraphView} model={model} namespace={namespace} />
      </StatusBox>
    );
  },
);
