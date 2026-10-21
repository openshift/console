import type { FC, ComponentProps } from 'react';
import { css } from '@patternfly/react-styles';
import type {
  Edge,
  WithRemoveConnectorProps,
  WithContextMenuProps,
  WithSourceDragProps,
  WithTargetDragProps,
} from '@patternfly/react-topology';
import { observer, useSelection, DefaultEdge, EdgeTerminalType } from '@patternfly/react-topology';
import { useAccessReviewAllowed } from '@console/dynamic-plugin-sdk';
import { referenceFor, modelFor } from '@console/internal/module/k8s';
import { getResource } from '../../../../utils/topology-utils';
import './BaseEdge.scss';

type BaseEdgeProps = ComponentProps<typeof DefaultEdge> &
  WithRemoveConnectorProps &
  Partial<WithSourceDragProps> &
  Partial<WithTargetDragProps> &
  Partial<WithContextMenuProps>;

const BaseEdge: FC<BaseEdgeProps> = ({
  className,
  element,
  endTerminalType = EdgeTerminalType.directional,
  onShowRemoveConnector,
  onHideRemoveConnector,
  targetDragRef,
  sourceDragRef,
  ...rest
}) => {
  const resourceObj = getResource((element as Edge).getSource());
  const resourceModel = resourceObj && modelFor(referenceFor(resourceObj));
  const [selected, onSelect] = useSelection({ controlled: true });

  const editAccess = useAccessReviewAllowed({
    group: resourceModel?.apiGroup,
    verb: 'patch',
    resource: resourceModel?.plural,
    name: resourceObj?.metadata.name,
    namespace: resourceObj?.metadata.namespace,
  });

  return (
    <DefaultEdge
      className={css('odc-base-edge', className)}
      element={element}
      onShowRemoveConnector={editAccess ? onShowRemoveConnector : undefined}
      onHideRemoveConnector={editAccess ? onHideRemoveConnector : undefined}
      targetDragRef={editAccess ? targetDragRef : undefined}
      sourceDragRef={editAccess ? sourceDragRef : undefined}
      endTerminalType={endTerminalType}
      selected={selected}
      onSelect={onSelect}
      {...rest}
    />
  );
};

export default observer<typeof BaseEdge>(BaseEdge);
