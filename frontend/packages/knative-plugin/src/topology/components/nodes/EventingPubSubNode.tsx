import * as React from 'react';
import * as classNames from 'classnames';
import { Tooltip } from '@patternfly/react-core';
import { useAccessReview } from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import {
  Node,
  observer,
  useHover,
  WithSelectionProps,
  WithDndDropProps,
  WithContextMenuProps,
  useSvgAnchor,
  useDragNode,
  useCombineRefs,
  WithCreateConnectorProps,
  createSvgIdUrl,
} from '@console/topology';
import SvgBoxedText from '@console/dev-console/src/components/svg/SvgBoxedText';
import {
  NodeShadows,
  NODE_SHADOW_FILTER_ID_HOVER,
  NODE_SHADOW_FILTER_ID,
  useSearchFilter,
  useDisplayFilters,
  nodeDragSourceSpec,
  getTopologyResourceObject,
} from '@console/dev-console/src/components/topology';
import { TYPE_EVENT_PUB_SUB } from '../../const';

import './EventingPubSubNode.scss';

export type EventingPubSubNodeProps = {
  element: Node;
  canDrop?: boolean;
  dropTarget?: boolean;
  edgeDragging?: boolean;
} & WithSelectionProps &
  WithDndDropProps &
  WithContextMenuProps &
  WithCreateConnectorProps;

const EventingPubSubNode: React.FC<EventingPubSubNodeProps> = ({
  element,
  canDrop,
  dropTarget,
  selected,
  onSelect,
  onContextMenu,
  contextMenuOpen,
  dndDropRef,
  edgeDragging,
  onHideCreateConnector,
  onShowCreateConnector,
}) => {
  const svgAnchorRef = useSvgAnchor();
  const [hover, hoverRef] = useHover();

  const resourceObj = getTopologyResourceObject(element.getData());
  const resourceModel = modelFor(referenceFor(resourceObj));
  const editAccess = useAccessReview({
    group: resourceModel.apiGroup,
    verb: 'patch',
    resource: resourceModel.plural,
    name: resourceObj.metadata.name,
    namespace: resourceObj.metadata.namespace,
  });
  const [{ dragging }, dragNodeRef] = useDragNode(
    nodeDragSourceSpec(TYPE_EVENT_PUB_SUB, true, editAccess),
    {
      element,
    },
  );

  const groupRefs = useCombineRefs(dragNodeRef, dndDropRef, hoverRef);
  const [filtered] = useSearchFilter(element.getLabel());
  const displayFilters = useDisplayFilters();
  const showLabels = displayFilters.showLabels || hover;
  const { width, height } = element.getBounds();
  const { data } = element.getData();

  React.useLayoutEffect(() => {
    if (editAccess) {
      if (hover) {
        onShowCreateConnector && onShowCreateConnector();
      } else {
        onHideCreateConnector && onHideCreateConnector();
      }
    }
  }, [editAccess, hover, onShowCreateConnector, onHideCreateConnector]);

  return (
    <Tooltip
      content="Move sink to Channel"
      trigger="manual"
      isVisible={dropTarget && canDrop}
      tippyProps={{ duration: 0, delay: 0 }}
    >
      <g
        className={classNames('odc-eventing-pubsub', {
          'is-filtered': filtered,
          'is-dragging': dragging || edgeDragging,
          'is-selected': selected,
        })}
        onClick={onSelect}
        onContextMenu={onContextMenu}
        ref={groupRefs}
      >
        <NodeShadows />
        <rect
          ref={svgAnchorRef}
          className="odc-eventing-pubsub__bg"
          x={0}
          y={0}
          width={width}
          height={height / 2}
          rx="15"
          ry="15"
          filter={createSvgIdUrl(
            hover || dragging || contextMenuOpen
              ? NODE_SHADOW_FILTER_ID_HOVER
              : NODE_SHADOW_FILTER_ID,
          )}
        />
        {showLabels && (data.kind || element.getLabel()) && (
          <SvgBoxedText
            className="odc-eventing-pubsub__label odc-base-node__label"
            x={width / 2}
            y={height - 30}
            paddingX={8}
            paddingY={4}
            kind={data.kind}
            typeIconClass="icon-knative"
          >
            {element.getLabel()}
          </SvgBoxedText>
        )}
      </g>
    </Tooltip>
  );
};

export default observer(EventingPubSubNode);
