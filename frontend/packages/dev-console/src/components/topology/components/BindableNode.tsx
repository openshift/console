import * as React from 'react';
import {
  observer,
  Node,
  useDndDrop,
  WithContextMenuProps,
  WithCreateConnectorProps,
  WithDragNodeProps,
  WithSelectionProps,
} from '@patternfly/react-topology';
import * as openshiftImg from '@console/internal/imgs/logos/openshift.svg';
import { modelFor, referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { calculateRadius } from '@console/shared';
import { TrapezoidBaseNode } from '@console/topology/src/components/graph-view/components/nodes';
import { getTopologyResourceObject } from '@console/topology/src/utils';
import { getRelationshipProvider } from '@console/topology/src/utils/relationship-provider-utils';

type BindableNodeProps = {
  element: Node;
  tooltipLabel?: string;
} & WithSelectionProps &
  WithDragNodeProps &
  WithContextMenuProps &
  WithCreateConnectorProps;

const BindableNode: React.FC<BindableNodeProps> = ({
  element,
  selected,
  onSelect,
  tooltipLabel,
  ...props
}) => {
  const spec = React.useMemo(() => getRelationshipProvider(), []);
  const { width, height } = element.getBounds();
  const size = Math.min(width, height);
  const iconRadius = Math.min(width, height) * 0.25;
  const { radius } = calculateRadius(size);
  const [dndDropProps, dndDropRef] = useDndDrop(spec, { element, ...props });
  const resourceObj = getTopologyResourceObject(element.getData());
  const resourceModel = modelFor(referenceFor(resourceObj));
  const iconData = element.getData()?.data?.icon || openshiftImg;

  return (
    <TrapezoidBaseNode
      className="bindable-node"
      tooltipLabel={tooltipLabel}
      onSelect={onSelect}
      icon={iconData}
      innerRadius={iconRadius}
      selected={selected}
      kind={resourceModel && referenceForModel(resourceModel)}
      element={element}
      outerRadius={radius}
      {...props}
      dndDropRef={dndDropRef}
      {...dndDropProps}
    />
  );
};

export default observer(BindableNode);
