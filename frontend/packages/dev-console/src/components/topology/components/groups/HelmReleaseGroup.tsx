import * as React from 'react';
import * as classNames from 'classnames';
import {
  Layer,
  useHover,
  Node,
  createSvgIdUrl,
  useDragNode,
  WithSelectionProps,
  observer,
  useCombineRefs,
} from '@console/topology';
import NodeShadows, { NODE_SHADOW_FILTER_ID_HOVER, NODE_SHADOW_FILTER_ID } from '../NodeShadows';
import SvgBoxedText from '../../../svg/SvgBoxedText';
import { TopologyFilters } from '../../filters/filter-utils';
import useFilter from '../../filters/useFilter';

export type HelmReleaseGroupProps = {
  element: Node;
  dragging?: boolean;
  filters: TopologyFilters;
} & WithSelectionProps;

const HelmReleaseGroup: React.FC<HelmReleaseGroupProps> = ({
  element,
  dragging,
  filters,
  onSelect,
  selected,
}) => {
  const [hover, hoverRef] = useHover();
  const { x, y, width, height } = element.getBounds();
  const dragNodeRef = useDragNode()[1];
  const dragLabelRef = useDragNode()[1];
  const refs = useCombineRefs(dragNodeRef, hoverRef);
  const filtered = useFilter(filters, { metadata: { name: element.getLabel() } });

  const rectClasses = classNames('odc-helm-release', {
    'is-selected': selected,
    'is-hover': hover,
    'is-filtered': filtered,
  });

  return (
    <g>
      <NodeShadows />
      <Layer id={dragging ? undefined : 'groups'}>
        <rect
          ref={refs}
          className={rectClasses}
          onClick={onSelect}
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
        <g onClick={onSelect}>
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
        </g>
      )}
    </g>
  );
};

export default observer(HelmReleaseGroup);
