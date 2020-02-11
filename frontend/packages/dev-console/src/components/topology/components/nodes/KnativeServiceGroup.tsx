import * as React from 'react';
import classNames from 'classnames';
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
  WithCreateConnectorProps,
} from '@console/topology';
import SvgBoxedText from '../../../svg/SvgBoxedText';
import RevisionTrafficSourceAnchor from '../anchors/RevisionTrafficSourceAnchor';
import { nodeDragSourceSpec } from '../../componentUtils';
import { TYPE_KNATIVE_SERVICE } from '../../const';
import useSearchFilter from '../../filters/useSearchFilter';
import NodeShadows, { NODE_SHADOW_FILTER_ID, NODE_SHADOW_FILTER_ID_HOVER } from '../NodeShadows';
import Decorator from './Decorator';

export type KnativeServiceGroupProps = {
  element: Node;
  highlight?: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
  editAccess?: boolean;
} & WithSelectionProps &
  WithDndDropProps &
  WithContextMenuProps &
  WithCreateConnectorProps;

const DECORATOR_RADIUS = 13;
const KnativeServiceGroup: React.FC<KnativeServiceGroupProps> = ({
  element,
  selected,
  onSelect,
  onContextMenu,
  contextMenuOpen,
  canDrop,
  dropTarget,
  dndDropRef,
  editAccess,
  onHideCreateConnector,
  onShowCreateConnector,
}) => {
  const [hover, hoverRef] = useHover();
  const [innerHover, innerHoverRef] = useHover();
  const [{ dragging, regrouping }, dragNodeRef] = useDragNode(
    nodeDragSourceSpec(TYPE_KNATIVE_SERVICE, true, editAccess),
    {
      element,
    },
  );
  const [{ dragging: labelDragging, regrouping: labelRegrouping }, dragLabelRef] = useDragNode(
    nodeDragSourceSpec(TYPE_KNATIVE_SERVICE, true, editAccess),
    {
      element,
    },
  );

  const nodeRefs = useCombineRefs(innerHoverRef, dragNodeRef);
  const hasChildren = element.getChildren()?.length > 0;
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
  useAnchor((e: Node) => new RectAnchor(e, 1.5));
  const [filtered] = useSearchFilter(element.getLabel());
  const { x, y, width, height } = element.getBounds();

  React.useLayoutEffect(() => {
    if (editAccess) {
      if (innerHover) {
        onShowCreateConnector && onShowCreateConnector();
      } else {
        onHideCreateConnector && onHideCreateConnector();
      }
    }
  }, [editAccess, innerHover, onShowCreateConnector, onHideCreateConnector]);

  return (
    <Tooltip
      content="Move sink to service"
      trigger="manual"
      isVisible={dropTarget && canDrop}
      tippyProps={{ duration: 0, delay: 0 }}
    >
      <g
        ref={hoverRef}
        onClick={onSelect}
        onContextMenu={editAccess ? onContextMenu : null}
        className={classNames('odc-knative-service', {
          'is-dragging': dragging || labelDragging,
          'is-highlight': canDrop,
          'is-filtered': filtered,
        })}
      >
        <NodeShadows />
        <Layer
          id={
            (dragging || labelDragging) && (regrouping || labelRegrouping) ? undefined : 'groups2'
          }
        >
          <g
            ref={nodeRefs}
            className={classNames('odc-knative-service', {
              'is-selected': selected,
              'is-dragging': dragging || labelDragging,
              'is-highlight': canDrop,
              'is-dropTarget': canDrop && dropTarget,
              'is-filtered': filtered,
            })}
          >
            <rect
              ref={dndDropRef}
              className="odc-knative-service__bg"
              x={x}
              y={y}
              width={width}
              height={height}
              rx="5"
              ry="5"
              filter={createSvgIdUrl(
                hover || innerHover || dragging || labelDragging || contextMenuOpen || dropTarget
                  ? NODE_SHADOW_FILTER_ID_HOVER
                  : NODE_SHADOW_FILTER_ID,
              )}
            />
            {!hasChildren && (
              <text x={x + width / 2} y={y + height / 2} dy="0.35em" textAnchor="middle">
                No Revisions
              </text>
            )}
          </g>
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
            dragRef={dragLabelRef}
            typeIconClass="icon-knative"
          >
            {element.getLabel()}
          </SvgBoxedText>
        )}
      </g>
    </Tooltip>
  );
};

export default observer(KnativeServiceGroup);
