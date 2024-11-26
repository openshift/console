import * as React from 'react';
import {
  observer,
  Node,
  useDndDrop,
  WithContextMenuProps,
  WithDragNodeProps,
  WithSelectionProps,
  GraphElement,
} from '@patternfly/react-topology';
import * as openshiftImg from '@console/internal/imgs/logos/openshift.svg';
import { modelFor, referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { WithCreateConnectorProps } from '@console/topology/src/behavior';
import { getTopologyResourceObject } from '../../../../utils';
import { getRelationshipProvider } from '../../../../utils/relationship-provider-utils';
import BaseNode from './BaseNode';

type BindableNodeProps = {
  element: GraphElement;
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
  ...rest
}) => {
  const nodeElement = element as Node;
  const spec = React.useMemo(() => getRelationshipProvider(), []);
  const { width, height } = nodeElement.getBounds();
  const iconRadius = Math.min(width, height) * 0.25;
  const [dndDropProps, dndDropRef] = useDndDrop(spec, { element: nodeElement, ...rest });
  const resourceObj = getTopologyResourceObject(element.getData());
  const resourceModel = modelFor(referenceFor(resourceObj));
  const iconData = element.getData()?.data?.icon || openshiftImg;
  const kind = resourceModel && referenceForModel(resourceModel);

  return (
    <BaseNode
      className="bindable-node"
      tooltipLabel={tooltipLabel}
      onSelect={onSelect}
      icon={iconData}
      kind={kind}
      innerRadius={iconRadius}
      selected={selected}
      element={nodeElement}
      {...rest}
      dndDropRef={dndDropRef}
      {...dndDropProps}
    />
  );
};

export default observer(BindableNode);
