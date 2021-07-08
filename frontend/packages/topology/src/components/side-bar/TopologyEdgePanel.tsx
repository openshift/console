import * as React from 'react';
import { Edge, isNode, Node } from '@patternfly/react-topology';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { ActionsMenu } from '@console/internal/components/utils';
import { edgeActions } from '../../actions/edgeActions';
import { TYPE_CONNECTS_TO, TYPE_SERVICE_BINDING, TYPE_TRAFFIC_CONNECTOR } from '../../const';
import TopologyEdgeResourcesPanel from './TopologyEdgeResourcesPanel';

type TopologyEdgePanelProps = {
  edge: Edge;
};

const connectorTypeToTitleKey = (type: string): string => {
  switch (type) {
    case TYPE_CONNECTS_TO:
      // t('topology~Visual connector')
      return 'topology~Visual connector';
    case TYPE_SERVICE_BINDING:
      // t('topology~Binding connector')
      return 'topology~Binding connector';
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
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            {t(connectorTypeToTitleKey(edge.getType()))}
          </div>
          <div className="co-actions">
            <ActionsMenu actions={edgeActions(edge, nodes)} />
          </div>
        </h1>
      </div>
      <ul
        className={classNames(
          'co-m-horizontal-nav__menu',
          'co-m-horizontal-nav__menu--within-sidebar',
          'co-m-horizontal-nav__menu--within-overview-sidebar',
          'odc-application-resource-tab',
        )}
      >
        <li className="co-m-horizontal-nav__menu-item">
          <button type="button">{t('topology~Resources')}</button>
        </li>
      </ul>
      <TopologyEdgeResourcesPanel edge={edge} />
    </div>
  );
};

export default TopologyEdgePanel;
