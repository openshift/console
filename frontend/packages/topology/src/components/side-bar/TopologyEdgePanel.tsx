/**
 * @deprecated This file needs to be removed after migrating the Traffic connector side-panel to dynamic extensions
 */
import * as React from 'react';
import { Edge, isNode, Node } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { ActionsMenu, SimpleTabNav } from '@console/internal/components/utils';
import { BasePageHeading } from '@console/internal/components/utils/headings';
import { edgeActions } from '../../actions/edgeActions';
import { TYPE_TRAFFIC_CONNECTOR } from '../../const';
import TopologyEdgeResourcesPanel from './TopologyEdgeResourcesPanel';

type TopologyEdgePanelProps = {
  edge: Edge;
};

const connectorTypeToTitleKey = (type: string): string => {
  switch (type) {
    case TYPE_TRAFFIC_CONNECTOR:
      // t('topology~Traffic connector')
      return 'topology~Traffic connector';
    default:
      return '';
  }
};

const TopologyEdgePanel: React.FC<TopologyEdgePanelProps> = ({ edge }) => {
  const { t } = useTranslation();
  const nodes = edge
    .getController()
    .getElements()
    .filter((e) => isNode(e) && !e.isGroup()) as Node[];

  return (
    <div className="overview__sidebar-pane resource-overview">
      <BasePageHeading
        title={t(connectorTypeToTitleKey(edge.getType()))}
        primaryAction={<ActionsMenu actions={edgeActions(edge, nodes)} />}
        hideFavoriteButton
      />
      <SimpleTabNav
        withinSidebar
        tabs={[
          {
            name: t('topology~Resources'),
            component: <TopologyEdgeResourcesPanel edge={edge} />,
          },
        ]}
      />
    </div>
  );
};

export default TopologyEdgePanel;
