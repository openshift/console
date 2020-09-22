import * as React from 'react';
import { observer } from '@patternfly/react-topology';
import { HintBlock, StatusBox } from '@console/internal/components/utils';
import ModelContext, { ExtensibleModel } from './data-transforms/ModelContext';
import { TopologyView } from './TopologyView';
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
    const { namespace, model, loaded, loadError } = React.useContext<ExtensibleModel>(ModelContext);
    return (
      <StatusBox
        skeleton={
          !showGraphView && (
            <div className="skeleton-overview">
              <div className="skeleton-overview--head" />
              <div className="skeleton-overview--tile" />
              <div className="skeleton-overview--tile" />
              <div className="skeleton-overview--tile" />
            </div>
          )
        }
        data={model ? model.nodes : null}
        label="Topology"
        loaded={loaded}
        loadError={loadError}
        EmptyMsg={EmptyMsg}
      >
        <TopologyView showGraphView={showGraphView} model={model} namespace={namespace} />
      </StatusBox>
    );
  },
);
