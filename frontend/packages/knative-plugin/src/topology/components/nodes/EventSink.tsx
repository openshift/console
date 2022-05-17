import * as React from 'react';
import { SignInAltIcon } from '@patternfly/react-icons';
import {
  Node,
  observer,
  WithSelectionProps,
  WithDndDropProps,
  WithContextMenuProps,
  useCombineRefs,
  WithDragNodeProps,
  WithCreateConnectorProps,
  Edge,
  useAnchor,
  AnchorEnd,
} from '@patternfly/react-topology';
import { DeploymentModel } from '@console/internal/models';
import { referenceForModel, referenceFor } from '@console/internal/module/k8s';
import { usePodsWatcher } from '@console/shared';
import { PodSet } from '@console/topology/src/components/graph-view';
import { BaseNode } from '@console/topology/src/components/graph-view/components/nodes';
import { KafkaSinkModel } from '../../../models';
import { getEventSourceIcon } from '../../../utils/get-knative-icon';
import { usePodsForRevisions } from '../../../utils/usePodsForRevisions';
import { TYPE_EVENT_SINK_LINK, TYPE_KAFKA_CONNECTION_LINK } from '../../const';
import EventSinkTargetAnchor from '../anchors/EventSinkTargetAnchor';

import './EventSource.scss';

export type EventSinkProps = {
  element: Node;
  dragging?: boolean;
  edgeDragging?: boolean;
} & WithSelectionProps &
  WithDragNodeProps &
  WithDndDropProps &
  WithContextMenuProps &
  WithCreateConnectorProps;

const EventSink: React.FC<EventSinkProps> = ({
  element,
  dragNodeRef,
  dndDropRef,
  onShowCreateConnector,
  ...rest
}) => {
  useAnchor(EventSinkTargetAnchor, AnchorEnd.target, TYPE_EVENT_SINK_LINK);
  const groupRefs = useCombineRefs(dragNodeRef, dndDropRef);
  const { data, resources, resource } = element.getData();
  const { width, height } = element.getBounds();
  const size = Math.min(width, height);
  const isKafkaConnectionLinkPresent =
    element.getSourceEdges()?.filter((edge: Edge) => edge.getType() === TYPE_KAFKA_CONNECTION_LINK)
      .length > 0;
  const { revisions, associatedDeployment = {} } = resources;
  const revisionIds = revisions?.map((revision) => revision.metadata.uid);
  const { loaded, loadError, pods } = usePodsForRevisions(revisionIds, resource.metadata.namespace);

  const {
    podData: podsDeployment,
    loadError: loadErrorDeployment,
    loaded: loadedDeployment,
  } = usePodsWatcher(
    associatedDeployment,
    associatedDeployment.kind ?? DeploymentModel.kind,
    associatedDeployment.metadata?.namespace || resource.metadata?.namespace,
  );

  const isKafkaSink = referenceFor(resource) === referenceForModel(KafkaSinkModel);

  const donutStatus = React.useMemo(() => {
    if (!revisionIds && loadedDeployment && !loadErrorDeployment) {
      return podsDeployment;
    }
    if (revisionIds && loaded && !loadError) {
      const [current, previous] = pods;
      const isRollingOut = !!current && !!previous;
      return {
        obj: resource,
        current,
        previous,
        isRollingOut,
        pods: [...(current?.pods || []), ...(previous?.pods || [])],
      };
    }
    return null;
  }, [
    revisionIds,
    loadedDeployment,
    loadErrorDeployment,
    loaded,
    loadError,
    podsDeployment,
    pods,
    resource,
  ]);

  return (
    <BaseNode
      className="odc-event-source"
      onShowCreateConnector={isKafkaConnectionLinkPresent && onShowCreateConnector}
      kind={data.kind}
      element={element}
      dragNodeRef={groupRefs}
      labelIcon={<SignInAltIcon />}
      {...rest}
    >
      {donutStatus && !isKafkaSink && (
        <PodSet size={size * 0.75} x={width / 2} y={height / 2} data={donutStatus} />
      )}
      {typeof getEventSourceIcon(data.kind, resources.obj) === 'string' ? (
        <image
          x={width * 0.33}
          y={height * 0.33}
          width={size * 0.35}
          height={size * 0.35}
          xlinkHref={getEventSourceIcon(data.kind, resources.obj, element.getType()) as string}
        />
      ) : (
        <foreignObject
          x={width * 0.33}
          y={height * 0.33}
          width={size * 0.35}
          height={size * 0.35}
          className="odc-event-source__svg-icon"
        >
          {getEventSourceIcon(data.kind, resources.obj, element.getType())}
        </foreignObject>
      )}
    </BaseNode>
  );
};

export default observer(EventSink);
