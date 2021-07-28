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
import { connect } from 'react-redux';
import * as openshiftImg from '@console/internal/imgs/logos/openshift.svg';
import { modelFor, referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';
import { obsOrKafkaConnectionDropTargetSpec } from '@console/rhoas-plugin/src/topology/components/rhoasComponentUtils';
import { calculateRadius } from '@console/shared';
import { TrapezoidBaseNode } from '@console/topology/src/components/graph-view/components/nodes';
import { getServiceBindingStatus, getTopologyResourceObject } from '@console/topology/src/utils';

interface StateProps {
  serviceBinding: boolean;
}

type BindableNodeProps = {
  element: Node;
  tooltipLabel?: string;
} & WithSelectionProps &
  WithDragNodeProps &
  WithContextMenuProps &
  WithCreateConnectorProps &
  StateProps;

const BindableNode: React.FC<BindableNodeProps> = ({
  element,
  selected,
  onSelect,
  serviceBinding,
  tooltipLabel,
  ...props
}) => {
  const { width, height } = element.getBounds();
  const size = Math.min(width, height);
  const iconRadius = Math.min(width, height) * 0.25;
  const { radius } = calculateRadius(size);
  const spec = React.useMemo(() => obsOrKafkaConnectionDropTargetSpec(serviceBinding), [
    serviceBinding,
  ]);
  const [dndDropProps, dndDropRef] = useDndDrop(spec, { element, ...props });
  const resourceObj = getTopologyResourceObject(element.getData());
  const resourceModel = modelFor(referenceFor(resourceObj));
  // const kindResource = referenceForModel(resourceModel);

  // const defaultIcon = getImageForIconClass(`icon-openshift`);
  return (
    <TrapezoidBaseNode
      className="KafkaNode"
      tooltipLabel={tooltipLabel}
      onSelect={onSelect}
      icon={openshiftImg}
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

const mapStateToProps = (state: RootState): StateProps => {
  return {
    serviceBinding: getServiceBindingStatus(state),
  };
};

export default connect(mapStateToProps)(observer(BindableNode));
