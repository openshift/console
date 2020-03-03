import * as React from 'react';
import * as classNames from 'classnames';
import {
  Layer,
  useHover,
  Node,
  createSvgIdUrl,
  useDragNode,
  WithSelectionProps,
  WithDndDropProps,
  observer,
  useCombineRefs,
} from '@console/topology';
import NodeShadows, { NODE_SHADOW_FILTER_ID_HOVER, NODE_SHADOW_FILTER_ID } from '../NodeShadows';
import SvgBoxedText from '../../../svg/SvgBoxedText';
import useSearchFilter from '../../filters/useSearchFilter';
import { nodeDragSourceSpec } from '../../componentUtils';
import { TYPE_HELM_RELEASE } from '../../const';

export type HelmReleaseGroupProps = {
  element: Node;
} & WithSelectionProps &
  WithDndDropProps;

const HelmReleaseGroup: React.FC<HelmReleaseGroupProps> = ({
  element,
  onSelect,
  selected,
  dndDropRef,
}) => {
  const [hover, hoverRef] = useHover();
  const [labelHover, labelHoverRef] = useHover();
  const { x, y, width, height } = element.getBounds();
  const [{ dragging }, dragNodeRef] = useDragNode(nodeDragSourceSpec(TYPE_HELM_RELEASE, false), {
    element,
  });
  const [{ dragging: labelDragging }, dragLabelRef] = useDragNode(
    nodeDragSourceSpec(TYPE_HELM_RELEASE, false),
    {
      element,
    },
  );
  const refs = useCombineRefs(dragNodeRef, dndDropRef, hoverRef);
  const [filtered] = useSearchFilter(element.getLabel());
  const hasChildren = element.getChildren()?.length > 0;
  return (
    <>
      <NodeShadows />
      <Layer id={dragging || labelDragging ? undefined : 'groups'}>
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
          {!hasChildren && (
            <text x={x + width / 2} y={y + height / 2} dy="0.35em" textAnchor="middle">
              No Resources
            </text>
          )}
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
