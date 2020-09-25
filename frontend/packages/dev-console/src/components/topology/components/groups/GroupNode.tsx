import * as React from 'react';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import {
  truncateMiddle,
  shouldTruncate,
  TruncateOptions,
} from '@console/internal/components/utils';
import { Node, useSize, useHover } from '@patternfly/react-topology';
import { RESOURCE_NAME_TRUNCATE_LENGTH } from '../../../../const';
import SvgCircledIcon from '../../../svg/SvgCircledIcon';
import { SvgResourceIcon } from '../../../svg/SvgResourceIcon';
import { OdcNodeModel } from '../../topology-types';
import { ResourceKindsInfo } from './ResourceKindsInfo';

import './GroupNode.scss';

const TOP_MARGIN = 20;
const LEFT_MARGIN = 20;
const TEXT_MARGIN = 10;

const truncateOptions: TruncateOptions = {
  length: RESOURCE_NAME_TRUNCATE_LENGTH,
};

type GroupNodeProps = {
  element: Node;
  kind?: string;
  emptyValue?: React.ReactNode;
  groupResources?: OdcNodeModel[];
  children?: React.ReactNode;
  typeIconClass?: string;
};

const ForwardRefGroupNode: React.FC<GroupNodeProps> = (
  { element, groupResources, children, kind, emptyValue, typeIconClass },
  groupRef,
) => {
  const [textHover, textHoverRef] = useHover();
  const [iconSize, iconRef] = useSize([kind]);
  const iconWidth = iconSize ? iconSize.width : 0;
  const iconHeight = iconSize ? iconSize.height : 0;
  const title = element.getLabel();

  return (
    <>
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
        <SvgResourceIcon
          ref={iconRef}
          x={LEFT_MARGIN}
          y={TOP_MARGIN - 2}
          kind={kind}
          leftJustified
        />
        {title && (
          <Tooltip
            content={title}
            position={TooltipPosition.top}
            trigger="manual"
            isVisible={textHover && shouldTruncate(title)}
          >
            <text
              ref={textHoverRef}
              className="odc-group-node__title"
              x={LEFT_MARGIN + iconWidth + TEXT_MARGIN}
              y={TOP_MARGIN + iconHeight}
              textAnchor="start"
              dy="-0.25em"
            >
              {truncateMiddle(title, truncateOptions)}
            </text>
          </Tooltip>
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
    </>
  );
};
const GroupNode = React.forwardRef(ForwardRefGroupNode);
export { GroupNode };
