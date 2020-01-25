import * as React from 'react';
import * as classNames from 'classnames';
import { connect } from 'react-redux';
import {
  Layer,
  useHover,
  Node,
  createSvgIdUrl,
  useDragNode,
  observer,
  useCombineRefs,
} from '@console/topology';
import { RootState } from '@console/internal/redux';
import NodeShadows, { NODE_SHADOW_FILTER_ID_HOVER, NODE_SHADOW_FILTER_ID } from '../NodeShadows';
import SvgBoxedText from '../../../svg/SvgBoxedText';
import { getTopologyFilters, TopologyFilters } from '../../filters/filter-utils';
import useFilter from '../../filters/useFilter';
import { nodeDragSourceSpec } from '../../componentUtils';
import { TYPE_OPERATOR_BACKED_SERVICE } from '../../const';
import './OperatorBackedService.scss';

export type OperatorBackedServiceProps = {
  element: Node;
  filters: TopologyFilters;
};

const OperatorBackedService: React.FC<OperatorBackedServiceProps> = ({ element, filters }) => {
  const [hover, hoverRef] = useHover();
  const { x, y, width, height } = element.getBounds();
  const dragNodeRef = useDragNode(nodeDragSourceSpec(TYPE_OPERATOR_BACKED_SERVICE, true, true), {
    element,
  })[1];
  const dragLabelRef = useDragNode(nodeDragSourceSpec(TYPE_OPERATOR_BACKED_SERVICE, true, true), {
    element,
  })[1];
  const refs = useCombineRefs(dragNodeRef, hoverRef);
  const filtered = useFilter(filters, { metadata: { name: element.getLabel() } });
  return (
    <g>
      <NodeShadows />
      <Layer id={'groups2'}>
        <rect
          ref={refs}
          className="odc-operator-group"
          x={x}
          y={y}
          width={width}
          height={height}
          rx="5"
          ry="5"
          filter={createSvgIdUrl(hover ? NODE_SHADOW_FILTER_ID_HOVER : NODE_SHADOW_FILTER_ID)}
        />
      </Layer>
      {element.getLabel() && (
        <SvgBoxedText
          className={classNames('odc-base-node__label', 'odc-operator-group__label', {
            'is-filtered': filtered,
          })}
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

const OperatorBackedServiceState = (state: RootState) => ({
  filters: getTopologyFilters(state),
});

export default connect(OperatorBackedServiceState)(observer(OperatorBackedService));
