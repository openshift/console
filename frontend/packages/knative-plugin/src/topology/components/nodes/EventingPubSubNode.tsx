import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import {
  Node,
  observer,
  useHover,
  WithSelectionProps,
  WithDndDropProps,
  WithContextMenuProps,
  useAnchor,
  useCombineRefs,
  createSvgIdUrl,
  WithDragNodeProps,
  AnchorEnd,
  WithCreateConnectorProps,
  RectAnchor,
} from '@patternfly/react-topology';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useAccessReview } from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import {
  NodeShadows,
  NODE_SHADOW_FILTER_ID_HOVER,
  NODE_SHADOW_FILTER_ID,
} from '@console/topology/src/components/graph-view';
import SvgBoxedText from '@console/topology/src/components/svg/SvgBoxedText';
import { TYPE_AGGREGATE_EDGE } from '@console/topology/src/const';
import {
  useSearchFilter,
  useDisplayFilters,
  useAllowEdgeCreation,
  getFilterById,
  SHOW_LABELS_FILTER_ID,
} from '@console/topology/src/filters';
import { getTopologyResourceObject } from '@console/topology/src/utils';
import * as eventPubSubImg from '../../../imgs/event-pub-sub.svg';
import {
  EventingTriggerModel,
  EventingBrokerModel,
  EventingSubscriptionModel,
} from '../../../models';
import PubSubSourceAnchor from '../anchors/PubSubSourceAnchor';
import PubSubTargetAnchor from '../anchors/PubSubTargetAnchor';

import './EventingPubSubNode.scss';

export type EventingPubSubNodeProps = {
  element: Node;
  canDrop?: boolean;
  dropTarget?: boolean;
  dragging?: boolean;
  edgeDragging?: boolean;
} & WithSelectionProps &
  WithDragNodeProps &
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
  dragNodeRef,
  dndDropRef,
  dragging,
  edgeDragging,
  onShowCreateConnector,
  onHideCreateConnector,
}) => {
  useAnchor(PubSubSourceAnchor, AnchorEnd.source);
  useAnchor(PubSubTargetAnchor, AnchorEnd.target);
  useAnchor(RectAnchor, AnchorEnd.source, TYPE_AGGREGATE_EDGE);
  useAnchor(RectAnchor, AnchorEnd.target, TYPE_AGGREGATE_EDGE);
  const [hover, hoverRef] = useHover();

  const { t } = useTranslation();
  const groupRefs = useCombineRefs(dragNodeRef, dndDropRef, hoverRef);
  const [filtered] = useSearchFilter(element.getLabel());
  const displayFilters = useDisplayFilters();
  const allowEdgeCreation = useAllowEdgeCreation();
  const showLabelsFilter = getFilterById(SHOW_LABELS_FILTER_ID, displayFilters);
  const showLabels = showLabelsFilter?.value || hover;
  const { width, height } = element.getBounds();
  const { data } = element.getData();

  const resourceObj = getTopologyResourceObject(element.getData());
  const resourceModel =
    modelFor(referenceFor(resourceObj)) === EventingBrokerModel
      ? EventingTriggerModel
      : EventingSubscriptionModel;
  const [createAccess] = useAccessReview({
    group: resourceModel.apiGroup,
    verb: 'create',
    resource: resourceModel.plural,
    name: resourceObj.metadata.name,
    namespace: resourceObj.metadata.namespace,
  });
  React.useLayoutEffect(() => {
    if (createAccess && allowEdgeCreation) {
      if (hover) {
        onShowCreateConnector && onShowCreateConnector();
      } else {
        onHideCreateConnector && onHideCreateConnector();
      }
    }
  }, [hover, onShowCreateConnector, onHideCreateConnector, createAccess, allowEdgeCreation]);

  return (
    <Tooltip
      content={t('knative-plugin~Move sink to {{resourceObjKind}}', {
        resourceObjKind: resourceObj.kind,
      })}
      trigger="manual"
      isVisible={dropTarget && canDrop}
      animationDuration={0}
    >
      <g
        className={classNames('odc-eventing-pubsub', {
          'is-dragging': dragging,
          'is-highlight': canDrop || edgeDragging,
          'is-selected': selected,
          'is-dropTarget': canDrop && dropTarget,
          'is-filtered': filtered,
        })}
        onClick={onSelect}
        onContextMenu={onContextMenu}
        ref={groupRefs}
      >
        <NodeShadows />
        <rect
          key={hover || dragging || contextMenuOpen || dropTarget ? 'rect-hover' : 'rect'}
          className="odc-eventing-pubsub__bg"
          x={0}
          y={0}
          width={width}
          height={height}
          rx="25"
          ry="25"
          filter={createSvgIdUrl(
            hover || dragging || contextMenuOpen || dropTarget
              ? NODE_SHADOW_FILTER_ID_HOVER
              : NODE_SHADOW_FILTER_ID,
          )}
        />
        <image
          x={width * 0.1}
          y={0}
          width={width * 0.8}
          height={width * 0.5}
          xlinkHref={eventPubSubImg}
        />
        {showLabels && (data.kind || element.getLabel()) && (
          <SvgBoxedText
            className="odc-eventing-pubsub__label odc-base-node__label"
            x={width / 2}
            y={height + 20}
            paddingX={8}
            paddingY={4}
            kind={data.kind}
          >
            {element.getLabel()}
          </SvgBoxedText>
        )}
      </g>
    </Tooltip>
  );
};

export default observer(EventingPubSubNode);
