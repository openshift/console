import * as React from 'react';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { ExternalLinkAltIcon, LinkIcon } from '@patternfly/react-icons';
import {
  Node,
  observer,
  WithDragNodeProps,
  WithSelectionProps,
  WithDndDropProps,
  WithContextMenuProps,
  useHover,
  useVisualizationController,
  ScaleDetailsLevel,
} from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { calculateRadius } from '@console/shared';
import { Decorator, BaseNode } from '@console/topology/src/components/graph-view';

import './SinkUriNode.scss';

export type SinkUriNodeProps = {
  element: Node;
  dragging?: boolean;
  edgeDragging?: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
} & WithSelectionProps &
  WithDragNodeProps &
  WithDndDropProps &
  WithContextMenuProps;

const DECORATOR_RADIUS = 13;
const SinkUriNode: React.FC<SinkUriNodeProps> = ({
  element,
  canDrop,
  dropTarget,
  contextMenuOpen,
  ...rest
}) => {
  const { t } = useTranslation();
  const { width, height } = element.getDimensions();
  const [hover, hoverRef] = useHover();
  const sinkData = element.getData().data;
  const size = Math.min(width, height);
  const { radius } = calculateRadius(size);
  const cx = width / 2;
  const cy = height / 2;
  const controller = useVisualizationController();
  const detailsLevel = controller.getGraph().getDetailsLevel();
  const showDetails = hover || contextMenuOpen || detailsLevel !== ScaleDetailsLevel.low;

  const decorators =
    sinkData.sinkUri && showDetails
      ? [
          <Tooltip
            key="URI"
            content={t('knative-plugin~Open URI')}
            position={TooltipPosition.right}
          >
            <Decorator
              x={cx + radius - DECORATOR_RADIUS * 0.7}
              y={cy - radius + DECORATOR_RADIUS * 0.7}
              radius={DECORATOR_RADIUS}
              href={sinkData.sinkUri}
              external
            >
              <g transform={`translate(-${DECORATOR_RADIUS / 2}, -${DECORATOR_RADIUS / 2})`}>
                <ExternalLinkAltIcon style={{ fontSize: DECORATOR_RADIUS }} title="Open URL" />
              </g>
            </Decorator>
          </Tooltip>,
        ]
      : undefined;

  return (
    <Tooltip
      content={t('knative-plugin~Move sink to URI')}
      trigger="manual"
      isVisible={dropTarget && canDrop}
      animationDuration={0}
    >
      <BaseNode
        className="odc-sink-uri"
        hoverRef={hoverRef}
        createConnectorAccessVerb="create"
        kind={sinkData.kind}
        element={element}
        dropTarget={dropTarget}
        canDrop={canDrop}
        attachments={decorators}
        {...rest}
      >
        <g transform={`translate(${cx / 2}, ${cy / 2})`}>
          <LinkIcon style={{ fontSize: radius }} />
        </g>
      </BaseNode>
    </Tooltip>
  );
};

export default observer(SinkUriNode);
