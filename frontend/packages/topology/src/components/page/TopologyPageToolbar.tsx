import * as React from 'react';
import { observer } from '@patternfly/react-topology';
import { Tooltip, Popover, Button } from '@patternfly/react-core';
import { ListIcon, TopologyIcon, QuestionCircleIcon } from '@patternfly/react-icons';
import TopologyShortcuts from '../graph-view/TopologyShortcuts';
import { ModelContext, ExtensibleModel } from '../../data-transforms/ModelContext';
import { TopologyViewType } from '../../topology-types';

interface TopologyPageToolbarProps {
  viewType: TopologyViewType;
  onViewChange: (view: TopologyViewType) => void;
}

const TopologyPageToolbar: React.FC<TopologyPageToolbarProps> = observer(
  ({ viewType, onViewChange }) => {
    const showGraphView = viewType === TopologyViewType.graph;
    const dataModelContext = React.useContext<ExtensibleModel>(ModelContext);
    const { namespace, isEmptyModel } = dataModelContext;

    if (!namespace || isEmptyModel) {
      return null;
    }

    return (
      <>
        {showGraphView ? (
          <Popover
            aria-label="Shortcuts"
            bodyContent={TopologyShortcuts}
            position="left"
            maxWidth="100vw"
          >
            <Button
              type="button"
              variant="link"
              className="odc-topology__shortcuts-button"
              icon={<QuestionCircleIcon />}
              data-test-id="topology-view-shortcuts"
            >
              View shortcuts
            </Button>
          </Popover>
        ) : null}
        <Tooltip position="left" content={showGraphView ? 'List View' : 'Topology View'}>
          <Button
            variant="link"
            className="pf-m-plain odc-topology__view-switcher"
            data-test-id="topology-switcher-view"
            onClick={() =>
              onViewChange(showGraphView ? TopologyViewType.list : TopologyViewType.graph)
            }
          >
            {showGraphView ? <ListIcon size="md" /> : <TopologyIcon size="md" />}
          </Button>
        </Tooltip>
      </>
    );
  },
);

export default TopologyPageToolbar;
