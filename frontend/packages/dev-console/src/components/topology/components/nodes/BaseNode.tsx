import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import {
  Node,
  useAnchor,
  EllipseAnchor,
  WithCreateConnectorProps,
  WithDndDropProps,
  WithDragNodeProps,
  WithSelectionProps,
  WithContextMenuProps,
  useCombineRefs,
  useHover,
  observer,
  createSvgIdUrl,
} from '@console/topology';
import { RootState } from '@console/internal/redux';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { useAccessReview } from '@console/internal/components/utils';
import SvgBoxedText from '../../../svg/SvgBoxedText';
import { getTopologyResourceObject } from '../../topology-utils';
import useFilter from '../../filters/useFilter';
import { getTopologyFilters, TopologyFilters } from '../../filters/filter-utils';
import NodeShadows, { NODE_SHADOW_FILTER_ID_HOVER, NODE_SHADOW_FILTER_ID } from '../NodeShadows';

import './BaseNode.scss';

export type BaseNodeProps = {
  outerRadius: number;
  innerRadius?: number;
  icon?: string;
  kind?: string;
  children?: React.ReactNode;
  attachments?: React.ReactNode;
  element: Node;
  droppable?: boolean;
  dragging?: boolean;
  edgeDragging?: boolean;
  dropTarget?: boolean;
  canDrop?: boolean;
  filters: TopologyFilters;
} & WithSelectionProps &
  WithDragNodeProps &
  WithDndDropProps &
  WithContextMenuProps &
  WithCreateConnectorProps;

const BaseNode: React.FC<BaseNodeProps> = ({
  outerRadius,
  innerRadius,
  icon,
  kind,
  element,
  selected,
  onSelect,
  children,
  filters,
  attachments,
  dragNodeRef,
  dndDropRef,
  canDrop,
  dragging,
  edgeDragging,
  dropTarget,
  onHideCreateConnector,
  onShowCreateConnector,
  onContextMenu,
  contextMenuOpen,
}) => {
  const [hover, hoverRef] = useHover();
  useAnchor(EllipseAnchor);
  const cx = element.getBounds().width / 2;
  const cy = element.getBounds().height / 2;
  const resourceObj = getTopologyResourceObject(element.getData());
  const resourceModel = modelFor(referenceFor(resourceObj));
  const editAccess = useAccessReview({
    group: resourceModel.apiGroup,
    verb: 'patch',
    resource: resourceModel.plural,
    name: resourceObj.metadata.name,
    namespace: resourceObj.metadata.namespace,
  });
  const filtered = useFilter(filters, resourceObj);
  const contentsClasses = classNames('odc-base-node__contents', {
    'is-hover': hover || contextMenuOpen,
    'is-highlight': canDrop,
    'is-dragging': dragging || edgeDragging,
    'is-droppable': dropTarget && canDrop,
    'is-filtered': filtered,
  });
  const refs = useCombineRefs<SVGEllipseElement>(hoverRef, dragNodeRef);

  React.useLayoutEffect(() => {
    if (editAccess) {
      if (hover) {
        onShowCreateConnector && onShowCreateConnector();
      } else {
        onHideCreateConnector && onHideCreateConnector();
      }
    }
  }, [hover, onShowCreateConnector, onHideCreateConnector, editAccess]);

  return (
    <g className="odc-base-node">
      <NodeShadows />
      <g
        data-test-id="base-node-handler"
        onClick={onSelect}
        onContextMenu={editAccess ? onContextMenu : null}
        ref={refs}
      >
        <circle
          className={classNames('odc-base-node__bg', { 'is-highlight': canDrop })}
          ref={dndDropRef}
          cx={cx}
          cy={cy}
          r={outerRadius}
          filter={createSvgIdUrl(
            hover || dragging || edgeDragging || dropTarget || contextMenuOpen
              ? NODE_SHADOW_FILTER_ID_HOVER
              : NODE_SHADOW_FILTER_ID,
          )}
        />
        <g className={contentsClasses}>
          {icon && (
            <image
              x={cx - innerRadius}
              y={cy - innerRadius}
              width={innerRadius * 2}
              height={innerRadius * 2}
              xlinkHref={icon}
            />
          )}
          {(kind || element.getLabel()) && (
            <SvgBoxedText
              className="odc-base-node__label"
              x={cx}
              y={cy + outerRadius + 20}
              paddingX={8}
              paddingY={4}
              kind={kind}
              truncate={16}
            >
              {element.getLabel()}
            </SvgBoxedText>
          )}
          {selected && (
            <circle className="odc-base-node__selection" cx={cx} cy={cy} r={outerRadius + 1} />
          )}
          {children}
        </g>
      </g>
      <g className={contentsClasses}>{attachments}</g>
    </g>
  );
};
const BaseNodeState = (state: RootState) => {
  const filters = getTopologyFilters(state);
  return { filters };
};
export default connect(BaseNodeState)(observer(BaseNode));
