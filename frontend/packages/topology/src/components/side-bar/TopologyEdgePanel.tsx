/**
 * @deprecated This file needs to be removed after migrating the Traffic connector side-panel to dynamic extensions
 */
import * as React from 'react';
import { Edge, isNode, Node } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { ActionsMenu, SimpleTabNav } from '@console/internal/components/utils';
import PrimaryHeading from '@console/shared/src/components/heading/PrimaryHeading';
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
      <div className="overview__sidebar-pane-head resource-overview__heading">
        <PrimaryHeading>
          <div className="co-m-pane__name co-resource-item">
            {t(connectorTypeToTitleKey(edge.getType()))}
          </div>
          <div className="co-actions">
            <ActionsMenu actions={edgeActions(edge, nodes)} />
          </div>
        </PrimaryHeading>
      </div>
      <SimpleTabNav
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
