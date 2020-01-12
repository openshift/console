import * as React from 'react';
import cx from 'classnames';
import { TooltipPosition, Tooltip } from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import {
  Node,
  AnchorEnd,
  observer,
  WithSelectionProps,
  WithContextMenuProps,
  WithDndDropProps,
  RectAnchor,
  useAnchor,
  useDragNode,
  Layer,
  useHover,
  createSvgIdUrl,
  useCombineRefs,
} from '@console/topology';
import { useAccessReview } from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { getTopologyResourceObject } from '../../topology-utils';
import SvgBoxedText from '../../../svg/SvgBoxedText';
import RevisionTrafficSourceAnchor from '../anchors/RevisionTrafficSourceAnchor';
import { nodeDragSourceSpec } from '../../componentUtils';
import { TYPE_KNATIVE_SERVICE } from '../../const';
import NodeShadows, { NODE_SHADOW_FILTER_ID, NODE_SHADOW_FILTER_ID_HOVER } from '../NodeShadows';
import Decorator from './Decorator';

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
} & WithSelectionProps &
  WithDndDropProps &
  WithContextMenuProps;

const DECORATOR_RADIUS = 13;
const KnativeService: React.FC<KnativeServiceProps> = ({
  element,
  selected,
  onSelect,
  onContextMenu,
  contextMenuOpen,
  dragging,
  regrouping,
  canDrop,
  dropTarget,
  dndDropRef,
}) => {
  const [hover, hoverRef] = useHover();
  const [innerHover, innerHoverRef] = useHover();
  const resourceObj = getTopologyResourceObject(element.getData());
  const resourceModel = modelFor(referenceFor(resourceObj));
  const editAccess = useAccessReview({
    group: resourceModel.apiGroup,
    verb: 'patch',
    resource: resourceModel.plural,
    name: resourceObj.metadata.name,
    namespace: resourceObj.metadata.namespace,
  });
  const dragNodeRef = useDragNode(nodeDragSourceSpec(TYPE_KNATIVE_SERVICE, true, editAccess), {
    element,
  })[1];
  const dragLabelRef = useDragNode(nodeDragSourceSpec(TYPE_KNATIVE_SERVICE, true, editAccess), {
    element,
  })[1];

  const nodeRefs = useCombineRefs(innerHoverRef, dragNodeRef, dndDropRef);
  const { data } = element.getData();
  const hasDataUrl = !!data.url;
  useAnchor(
    React.useCallback(
      (node: Node) => new RevisionTrafficSourceAnchor(node, hasDataUrl ? DECORATOR_RADIUS : 0),
      [hasDataUrl],
    ),
    AnchorEnd.source,
    'revision-traffic',
  );
  useAnchor(RectAnchor);
  const { x, y, width, height } = element.getBounds();
  const tipContent = `Move sink to service`;

  return (
    <Tooltip content={tipContent} trigger="manual" isVisible={dropTarget && canDrop}>
      <g ref={hoverRef} onClick={onSelect} onContextMenu={editAccess ? onContextMenu : null}>
        <NodeShadows />
        <Layer id={dragging && regrouping ? undefined : 'groups2'}>
          <rect
            ref={nodeRefs}
            className={cx('odc-knative-service', {
              'is-selected': selected,
              'is-dragging': dragging,
              'is-highlight': canDrop,
            })}
            x={x}
            y={y}
            width={width}
            height={height}
            rx="5"
            ry="5"
            filter={createSvgIdUrl(
              hover || innerHover || dragging || contextMenuOpen || dropTarget
                ? NODE_SHADOW_FILTER_ID_HOVER
                : NODE_SHADOW_FILTER_ID,
            )}
          />
        </Layer>
        {hasDataUrl && (
          <Tooltip key="route" content="Open URL" position={TooltipPosition.right}>
            <Decorator x={x + width} y={y} radius={DECORATOR_RADIUS} href={data.url} external>
              <g transform="translate(-6.5, -6.5)">
                <ExternalLinkAltIcon style={{ fontSize: DECORATOR_RADIUS }} alt="Open URL" />
              </g>
            </Decorator>
          </Tooltip>
        )}
        {(data.kind || element.getLabel()) && (
          <SvgBoxedText
            className="odc-knative-service__label odc-base-node__label"
            x={x + width / 2}
            y={y + height + 20}
            paddingX={8}
            paddingY={4}
            kind={data.kind}
            truncate={16}
            dragRef={dragLabelRef}
          >
            {element.getLabel()}
          </SvgBoxedText>
        )}
      </g>
    </Tooltip>
  );
};

export default observer(KnativeService);
