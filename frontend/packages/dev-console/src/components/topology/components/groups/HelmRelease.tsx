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
import './HelmRelease.scss';
import { getTopologyFilters, TopologyFilters } from '../../filters/filter-utils';
import useFilter from '../../filters/useFilter';

export type HelmReleaseProps = {
  element: Node;
  dragging?: boolean;
  filters: TopologyFilters;
};

const HelmRelease: React.FC<HelmReleaseProps> = ({ element, dragging, filters }) => {
  const [hover, hoverRef] = useHover();
  const { x, y, width, height } = element.getBounds();
  const dragNodeRef = useDragNode()[1];
  const dragLabelRef = useDragNode()[1];
  const refs = useCombineRefs(dragNodeRef, hoverRef);
  const filtered = useFilter(filters, { metadata: { name: element.getLabel() } });
  return (
    <g>
      <NodeShadows />
      <Layer id={dragging ? undefined : 'groups'}>
        <rect
          ref={refs}
          className="odc-helm-release"
          x={x}
          y={y}
          width={width}
          height={height}
          rx="5"
          ry="5"
          filter={createSvgIdUrl(
            hover || dragging ? NODE_SHADOW_FILTER_ID_HOVER : NODE_SHADOW_FILTER_ID,
          )}
        />
      </Layer>
      {element.getLabel() && (
        <SvgBoxedText
          className={classNames('odc-base-node__label', 'odc-helm-release__label', {
            'is-filtered': filtered,
            'is-dragging': dragging,
          })}
          x={x + width / 2}
          y={y + height + 20}
          paddingX={8}
          paddingY={4}
          kind="HelmRelease"
          truncate={16}
          dragRef={dragLabelRef}
          typeIconClass="icon-helm"
        >
          {element.getLabel()}
        </SvgBoxedText>
      )}
    </g>
  );
};

const HelmReleaseState = (state: RootState) => ({
  filters: getTopologyFilters(state),
});

export default connect(HelmReleaseState)(observer(HelmRelease));
