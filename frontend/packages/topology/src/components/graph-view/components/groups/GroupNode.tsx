import type { ReactNode, FC } from 'react';
import { useRef, useCallback } from 'react';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import type {
  Node,
  WithSelectionProps,
  WithDndDropProps,
  WithDragNodeProps,
  WithContextMenuProps,
} from '@patternfly/react-topology';
import {
  useSize,
  useHover,
  DefaultNode,
  LabelBadge,
  observer,
  useAnchor,
} from '@patternfly/react-topology';
import type { TruncateOptions } from '@console/internal/components/utils';
import { truncateMiddle, shouldTruncate } from '@console/internal/components/utils';
import { RESOURCE_NAME_TRUNCATE_LENGTH } from '@console/shared';
import { useSearchFilter } from '../../../../filters';
import type { OdcNodeModel } from '../../../../topology-types';
import SvgCircledIcon from '../../../svg/SvgCircledIcon';
import GroupNodeAnchor from './GroupNodeAnchor';
import ResourceKindsInfo from './ResourceKindsInfo';

import './GroupNode.scss';

const TOP_MARGIN = 20;
const LEFT_MARGIN = 20;
const TEXT_MARGIN = 10;

const truncateOptions: TruncateOptions = {
  length: RESOURCE_NAME_TRUNCATE_LENGTH,
};

type GroupNodeProps = {
  element: Node;
  bgClassName: string;
  badge?: string;
  badgeColor?: string;
  badgeClassName?: string;
  emptyValue?: ReactNode;
  groupResources?: OdcNodeModel[];
  children?: ReactNode;
  typeIconClass?: string;
  canDrop?: boolean;
  dropTarget?: boolean;
  dragging?: boolean;
  dragRegroupable?: boolean;
  hover?: boolean;
} & Partial<WithSelectionProps & WithDndDropProps & WithContextMenuProps & WithDragNodeProps>;

const GroupNode: FC<GroupNodeProps> = ({
  element,
  bgClassName,
  badge,
  badgeColor,
  badgeClassName,
  children,
  emptyValue,
  typeIconClass,
  ...rest
}) => {
  const ref = useRef();
  const [filtered] = useSearchFilter(element.getLabel());
  const [textHover, textHoverRef] = useHover();
  const [iconSize, iconRef] = useSize([badge]);
  const iconWidth = iconSize ? iconSize.width : 0;
  const iconHeight = iconSize ? iconSize.height : 0;
  const title = element.getLabel();
  const { groupResources } = element.getData();
  const [groupSize, groupRef] = useSize([groupResources]);
  const width = groupSize ? groupSize.width : 0;
  const height = groupSize ? groupSize.height : 0;
  useAnchor(
    useCallback((node: Node) => new GroupNodeAnchor(node, width, height, 1.5), [width, height]),
  );

  const getCustomShape = () => () => (
    <rect
      className={css('odc-group-node__bg', bgClassName)}
      x={0}
      y={0}
      width={width}
      height={height}
      rx="5"
      ry="5"
    />
  );

  return (
    <DefaultNode
      element={element}
      className={css('odc-group-node', { 'is-filtered': filtered })}
      badge={badge}
      badgeColor={badgeColor}
      badgeClassName={badgeClassName}
      showLabel={false}
      getCustomShape={getCustomShape}
      {...rest}
    >
      <g ref={groupRef}>
        {typeIconClass && (
          <SvgCircledIcon
            className="odc-group-node__type-icon"
            x={10}
            y={-10}
            width={20}
            height={20}
            iconClass={typeIconClass}
          />
        )}
        <g ref={groupRef}>
          <LabelBadge
            ref={iconRef}
            x={LEFT_MARGIN}
            y={TOP_MARGIN - 2}
            badge={badge}
            badgeClassName={badgeClassName}
            badgeColor={badgeColor}
          />
          {title && (
            <g ref={textHoverRef}>
              <Tooltip
                content={title}
                position={TooltipPosition.top}
                trigger="manual"
                isVisible={textHover && shouldTruncate(title, truncateOptions)}
                triggerRef={ref}
              >
                <text
                  ref={ref}
                  className="odc-group-node__title"
                  x={LEFT_MARGIN + iconWidth + TEXT_MARGIN}
                  y={TOP_MARGIN + iconHeight}
                  textAnchor="start"
                  dy="-0.25em"
                >
                  {truncateMiddle(title, truncateOptions)}
                </text>
              </Tooltip>
            </g>
          )}
          {(children || groupResources || emptyValue) && (
            <g transform={`translate(${LEFT_MARGIN}, ${TOP_MARGIN + iconHeight})`}>
              {(groupResources || emptyValue) && (
                <ResourceKindsInfo groupResources={groupResources} emptyValue={emptyValue} />
              )}
              {children}
            </g>
          )}
        </g>
      </g>
    </DefaultNode>
  );
};

export default observer(GroupNode);
