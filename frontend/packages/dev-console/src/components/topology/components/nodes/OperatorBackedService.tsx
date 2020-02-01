import * as React from 'react';
import * as classNames from 'classnames';
import {
  Layer,
  useHover,
  Node,
  createSvgIdUrl,
  useDragNode,
  observer,
  useCombineRefs,
} from '@console/topology';
import NodeShadows, { NODE_SHADOW_FILTER_ID_HOVER, NODE_SHADOW_FILTER_ID } from '../NodeShadows';
import SvgBoxedText from '../../../svg/SvgBoxedText';
import useSearchFilter from '../../filters/useSearchFilter';
import { nodeDragSourceSpec } from '../../componentUtils';
import { TYPE_OPERATOR_BACKED_SERVICE } from '../../const';
import './OperatorBackedService.scss';

export type OperatorBackedServiceProps = {
  element: Node;
};

const OperatorBackedService: React.FC<OperatorBackedServiceProps> = ({ element }) => {
  const [hover, hoverRef] = useHover();
  const [labelHover, labelHoverRef] = useHover();
  const { x, y, width, height } = element.getBounds();
  const [{ dragging }, dragNodeRef] = useDragNode(
    nodeDragSourceSpec(TYPE_OPERATOR_BACKED_SERVICE, false),
    {
      element,
    },
  );
  const [{ dragging: labelDragging }, dragLabelRef] = useDragNode(
    nodeDragSourceSpec(TYPE_OPERATOR_BACKED_SERVICE, false),
    {
      element,
    },
  );
  const refs = useCombineRefs(dragNodeRef, hoverRef);
  const [filtered] = useSearchFilter(element.getLabel());
  return (
    <>
      <NodeShadows />
      <Layer id={dragging || labelDragging ? undefined : 'groups2'}>
        <g
          ref={refs}
          className={classNames('odc-operator-backed-service', {
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
              hover || labelHover ? NODE_SHADOW_FILTER_ID_HOVER : NODE_SHADOW_FILTER_ID,
            )}
          />
        </g>
      </Layer>
      {element.getLabel() && (
        <g
          ref={labelHoverRef}
          className={classNames('odc-operator-backed-service', {
            'is-dragging': dragging || labelDragging,
            'is-filtered': filtered,
          })}
        >
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
        </g>
      )}
    </>
  );
};

export default observer(OperatorBackedService);
