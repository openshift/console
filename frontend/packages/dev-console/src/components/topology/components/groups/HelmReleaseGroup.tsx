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
import useSearchFilter from '../../filters/useSearchFilter';

export type HelmReleaseGroupProps = {
  element: Node;
} & WithSelectionProps;

const HelmReleaseGroup: React.FC<HelmReleaseGroupProps> = ({ element, onSelect, selected }) => {
  const [hover, hoverRef] = useHover();
  const [labelHover, labelHoverRef] = useHover();
  const { x, y, width, height } = element.getBounds();
  const [{ dragging }, dragNodeRef] = useDragNode({
    collect: (monitor) => ({
      dragging: monitor.isDragging(),
    }),
  });
  const [{ labelDragging }, dragLabelRef] = useDragNode({
    collect: (monitor) => ({
      labelDragging: monitor.isDragging(),
    }),
  });
  const refs = useCombineRefs(dragNodeRef, hoverRef);
  const [filtered] = useSearchFilter(element.getLabel());
  return (
    <>
      <NodeShadows />
      <Layer id={dragging ? undefined : 'groups'}>
        <g
          className={classNames('odc-helm-release', {
            'is-dragging': dragging || labelDragging,
            'is-selected': selected,
            'is-filtered': filtered,
          })}
        >
          <rect
            ref={refs}
            className="odc-helm-release__bg"
            onClick={onSelect}
            x={x}
            y={y}
            width={width}
            height={height}
            rx="5"
            ry="5"
            filter={createSvgIdUrl(
              hover || labelHover || dragging || labelDragging
                ? NODE_SHADOW_FILTER_ID_HOVER
                : NODE_SHADOW_FILTER_ID,
            )}
          />
        </g>
      </Layer>
      {element.getLabel() && (
        <g
          ref={labelHoverRef}
          onClick={onSelect}
          className={classNames('odc-helm-release', {
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
            kind="HelmRelease"
            dragRef={dragLabelRef}
            typeIconClass="icon-helm"
          >
            {element.getLabel()}
          </SvgBoxedText>
        </g>
      )}
    </>
  );
};

export default observer(HelmReleaseGroup);
