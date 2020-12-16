import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { observer } from '@patternfly/react-topology';
import { Tooltip, Popover, Button } from '@patternfly/react-core';
import { ListIcon, TopologyIcon, QuestionCircleIcon } from '@patternfly/react-icons';
import { useIsMobile } from '@console/shared';
import { getTopologyShortcuts } from '../graph-view/TopologyShortcuts';
import { ModelContext, ExtensibleModel } from '../../data-transforms/ModelContext';
import { TopologyViewType } from '../../topology-types';

interface TopologyPageToolbarProps {
  viewType: TopologyViewType;
  onViewChange: (view: TopologyViewType) => void;
}

const TopologyPageToolbar: React.FC<TopologyPageToolbarProps> = observer(
  ({ viewType, onViewChange }) => {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const showGraphView = viewType === TopologyViewType.graph;
    const dataModelContext = React.useContext<ExtensibleModel>(ModelContext);
    const { namespace, isEmptyModel } = dataModelContext;
    const viewChangeTooltipContent = showGraphView
      ? t('topology~List view')
      : t('topology~Topology view');

    if (!namespace || isEmptyModel) {
      return null;
    }

    return (
      <>
        {showGraphView && !isMobile ? (
          <Popover
            aria-label={t('topology~Shortcuts')}
            bodyContent={getTopologyShortcuts(t)}
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
              {t('topology~View shortcuts')}
            </Button>
          </Popover>
        ) : null}
        <Tooltip position="left" content={viewChangeTooltipContent}>
          <Button
            variant="link"
            aria-label={viewChangeTooltipContent}
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
