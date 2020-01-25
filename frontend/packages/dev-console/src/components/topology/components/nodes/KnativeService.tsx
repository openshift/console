import * as React from 'react';
import { connect } from 'react-redux';
import { RootState } from '@console/internal/redux';
import {
  Node,
  observer,
  WithSelectionProps,
  WithContextMenuProps,
  WithDndDropProps,
} from '@console/topology';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { useAccessReview } from '@console/internal/components/utils';
import { getTopologyFilters, TopologyFilters } from '../../filters/filter-utils';
import { getTopologyResourceObject } from '../../topology-utils';
import KnativeServiceNode from './KnativeServiceNode';
import KnativeServiceGroup from './KnativeServiceGroup';

import './KnativeService.scss';

export type KnativeServiceProps = {
  element: Node;
  droppable?: boolean;
  hover?: boolean;
  dragging: boolean;
  highlight?: boolean;
  regrouping: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
  filters?: TopologyFilters;
} & WithSelectionProps &
  WithDndDropProps &
  WithContextMenuProps;

const KnativeService: React.FC<KnativeServiceProps> = (props) => {
  const resourceObj = getTopologyResourceObject(props.element.getData());
  const resourceModel = modelFor(referenceFor(resourceObj));
  const editAccess = useAccessReview({
    group: resourceModel.apiGroup,
    verb: 'patch',
    resource: resourceModel.plural,
    name: resourceObj.metadata.name,
    namespace: resourceObj.metadata.namespace,
  });
  if (
    props.element.isCollapsed() ||
    !props.element.getData().groupResources ||
    !props.element.getData().groupResources.length
  ) {
    return <KnativeServiceNode {...props} editAccess={editAccess} />;
  }

  return <KnativeServiceGroup {...props} editAccess={editAccess} />;
};

const KnativeServiceState = (state: RootState) => {
  const filters = getTopologyFilters(state);
  return { filters };
};

export default connect(KnativeServiceState)(observer(KnativeService));
