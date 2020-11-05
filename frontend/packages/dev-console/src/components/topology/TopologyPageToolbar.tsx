import * as React from 'react';
import { observer } from '@patternfly/react-topology';
import { Tooltip, Popover, Button } from '@patternfly/react-core';
import { ListIcon, TopologyIcon, QuestionCircleIcon } from '@patternfly/react-icons';
import TopologyShortcuts from './TopologyShortcuts';
import ModelContext, { ExtensibleModel } from './data-transforms/ModelContext';

interface TopologyPageToolbarProps {
  showGraphView: boolean;
  onViewChange: (graphView: boolean) => void;
}

export const TopologyPageToolbar: React.FC<TopologyPageToolbarProps> = observer(
  ({ showGraphView, onViewChange }) => {
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
            onClick={() => onViewChange(!showGraphView)}
          >
            {showGraphView ? <ListIcon size="md" /> : <TopologyIcon size="md" />}
          </Button>
        </Tooltip>
      </>
    );
  },
);
