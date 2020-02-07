import * as React from 'react';
import * as classNames from 'classnames';
import {
  Node,
  observer,
  WithSelectionProps,
  useDragNode,
  Layer,
  useHover,
  createSvgIdUrl,
  useCombineRefs,
} from '@console/topology';
import SvgBoxedText from '../../../svg/SvgBoxedText';
import { nodeDragSourceSpec } from '../../componentUtils';
import { TYPE_OPERATOR_BACKED_SERVICE } from '../../const';
import useSearchFilter from '../../filters/useSearchFilter';
import NodeShadows, { NODE_SHADOW_FILTER_ID, NODE_SHADOW_FILTER_ID_HOVER } from '../NodeShadows';

export type OperatorBackedServiceGroupProps = {
  element: Node;
} & WithSelectionProps;

const OperatorBackedServiceGroup: React.FC<OperatorBackedServiceGroupProps> = ({
  element,
  selected,
  onSelect,
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
  const { data } = element.getData();
  const [filtered] = useSearchFilter(element.getLabel());
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
        </g>
      </Layer>
      {(data.kind || element.getLabel()) && (
        <SvgBoxedText
          className="odc-base-node__label"
          x={x + width / 2}
          y={y + height + 20}
          paddingX={8}
          paddingY={4}
          kind="Operator"
          truncate={16}
          dragRef={dragLabelRef}
          typeIconClass={element.getData().data.builderImage}
        >
          {element.getLabel()}
        </SvgBoxedText>
      )}
    </g>
  );
};

export default observer(OperatorBackedServiceGroup);
