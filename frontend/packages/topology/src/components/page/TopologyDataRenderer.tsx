import * as React from 'react';
import { observer } from '@patternfly/react-topology';
import { HintBlock, StatusBox } from '@console/internal/components/utils';
import EmptyState from '@console/dev-console/src/components/EmptyState';
import { ModelContext, ExtensibleModel } from '../../data-transforms/ModelContext';
import TopologyView from './TopologyView';
import { TopologyViewType } from '../../topology-types';

interface TopologyDataRendererProps {
  viewType: TopologyViewType;
  title: string;
}

const TopologyDataRenderer: React.FC<TopologyDataRendererProps> = observer(
  ({ viewType, title }) => {
    const { namespace, model, loaded, loadError } = React.useContext<ExtensibleModel>(ModelContext);
    const EmptyMsg = React.useCallback(
      () => (
        <EmptyState
          title={title}
          hintBlock={
            <HintBlock title="No resources found">
              <p>
                To add content to your project, create an application, component or service using
                one of these options.
              </p>
            </HintBlock>
          }
        />
      ),
      [title],
    );

    return (
      <StatusBox
        skeleton={
          viewType === TopologyViewType.list && (
            <div className="co-m-pane__body skeleton-overview">
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
        <TopologyView viewType={viewType} model={model} namespace={namespace} />
      </StatusBox>
    );
  },
);

export default TopologyDataRenderer;
