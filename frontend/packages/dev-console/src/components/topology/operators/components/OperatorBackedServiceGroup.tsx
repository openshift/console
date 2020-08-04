import * as React from 'react';
import * as classNames from 'classnames';
import {
  Node,
  observer,
  WithSelectionProps,
  WithDndDropProps,
  useDragNode,
  Layer,
  useHover,
  createSvgIdUrl,
  useCombineRefs,
} from '@patternfly/react-topology';
import { getLabelsAsString } from '@console/shared';
import SvgBoxedText from '../../../svg/SvgBoxedText';
import { nodeDragSourceSpec } from '../../components/componentUtils';
import { TYPE_OPERATOR_BACKED_SERVICE } from './const';
import {
  getFilterById,
  useDisplayFilters,
  useSearchFilter,
  SHOW_LABELS_FILTER_ID,
} from '../../filters';
import {
  NodeShadows,
  NODE_SHADOW_FILTER_ID,
  NODE_SHADOW_FILTER_ID_HOVER,
} from '../../components/NodeShadows';
import { getResource, getResourceKind } from '../../topology-utils';

export type OperatorBackedServiceGroupProps = {
  element: Node;
} & WithSelectionProps &
  WithDndDropProps;

const OperatorBackedServiceGroup: React.FC<OperatorBackedServiceGroupProps> = ({
  element,
  selected,
  onSelect,
  dndDropRef,
}) => {
  const [hover, hoverRef] = useHover();
  const [innerHover, innerHoverRef] = useHover();
  const [{ dragging, regrouping }, dragNodeRef] = useDragNode(
    nodeDragSourceSpec(TYPE_OPERATOR_BACKED_SERVICE, false),
    {
      element,
    },
  );
  const [{ dragging: labelDragging, regrouping: labelRegrouping }, dragLabelRef] = useDragNode(
    nodeDragSourceSpec(TYPE_OPERATOR_BACKED_SERVICE, false),
    {
      element,
    },
  );

  const nodeRefs = useCombineRefs(innerHoverRef, dragNodeRef);
  const hasChildren = element.getChildren()?.length > 0;
  const { data } = element.getData();
  const [filtered] = useSearchFilter(element.getLabel(), getLabelsAsString(getResource(element)));
  const displayFilters = useDisplayFilters();
  const showLabelsFilter = getFilterById(SHOW_LABELS_FILTER_ID, displayFilters);
  const showLabels = showLabelsFilter?.value || hover || innerHover;
  const { x, y, width, height } = element.getBounds();

  return (
    <g
      ref={hoverRef}
      onClick={onSelect}
      className={classNames('odc-operator-backed-service', {
        'is-dragging': dragging || labelDragging,
        'is-filtered': filtered,
      })}
    >
      <NodeShadows />
      <Layer
        id={(dragging || labelDragging) && (regrouping || labelRegrouping) ? undefined : 'groups2'}
      >
        <g
          ref={nodeRefs}
          className={classNames('odc-operator-backed-service', {
            'is-selected': selected,
            'is-dragging': dragging || labelDragging,
            'is-filtered': filtered,
          })}
        >
          <rect
            ref={dndDropRef}
            className="odc-operator-backed-service__bg"
            x={x}
            y={y}
            width={width}
            height={height}
            rx="5"
            ry="5"
            filter={createSvgIdUrl(
              hover || innerHover || dragging || labelDragging
                ? NODE_SHADOW_FILTER_ID_HOVER
                : NODE_SHADOW_FILTER_ID,
            )}
          />
          {!hasChildren && (
            <text x={x + width / 2} y={y + height / 2} dy="0.35em" textAnchor="middle">
              No Resources
            </text>
          )}
        </g>
      </Layer>
      {showLabels && (getResourceKind(element) || element.getLabel()) && (
        <SvgBoxedText
          className="odc-base-node__label"
          x={x + width / 2}
          y={y + height + 20}
          paddingX={8}
          paddingY={4}
          kind={data.operatorKind}
          dragRef={dragLabelRef}
          typeIconClass={data.builderImage}
        >
          {element.getLabel()}
        </SvgBoxedText>
      )}
    </g>
  );
};

export default observer(OperatorBackedServiceGroup);
