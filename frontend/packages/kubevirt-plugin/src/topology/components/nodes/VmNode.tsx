import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { VirtualMachineIcon } from '@patternfly/react-icons';
import {
  Node,
  NodeModel,
  observer,
  RectAnchor,
  useAnchor,
  WithContextMenuProps,
  WithDndDropProps,
  WithDragNodeProps,
  WithSelectionProps,
} from '@patternfly/react-topology';
import * as classNames from 'classnames';
import { WithCreateConnectorProps } from '@console/topology/src/behavior';
import { BaseNode } from '@console/topology/src/components/graph-view';
import { TopologyDataObject } from '@console/topology/src/topology-types';
import { VMStatus } from '../../../constants/vm/vm-status';
import { VMNodeData } from '../../types';

import './VmNode.scss';

export type VmNodeProps = {
  element: Node<NodeModel, TopologyDataObject<VMNodeData>>;
  hover?: boolean;
  dragging?: boolean;
  edgeDragging?: boolean;
  highlight?: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
  urlAnchorRef?: React.Ref<SVGCircleElement>;
} & WithSelectionProps &
  WithContextMenuProps &
  WithDragNodeProps &
  WithDndDropProps &
  WithCreateConnectorProps;

const VM_STATUS_GAP = 7;
const VM_STATUS_WIDTH = 7;
const VM_STATUS_RADIUS = 7;

const ObservedVmNode: React.FC<VmNodeProps> = ({
  element,
  canDrop,
  dropTarget,
  children,
  ...rest
}) => {
  useAnchor(RectAnchor);
  const { width, height } = element.getBounds();
  const vmData = element.getData().data;
  const { kind, osImage, vmStatusBundle } = vmData;
  const iconRadius = Math.min(width, height) * 0.25;
  const tipContent = `Create a visual connector`;

  let statusClass;
  const statusMessage = vmStatusBundle.message;
  switch (vmStatusBundle.status) {
    case VMStatus.V2V_CONVERSION_PENDING:
    case VMStatus.V2V_VM_IMPORT_PENDING:
    case VMStatus.CDI_IMPORT_PENDING:
      statusClass = 'kubevirt-m-pending';
      break;
    case VMStatus.V2V_CONVERSION_ERROR:
    case VMStatus.LAUNCHER_POD_ERROR:
    case VMStatus.VM_ERROR:
    case VMStatus.VMI_ERROR:
    case VMStatus.CDI_IMPORT_ERROR:
    case VMStatus.V2V_VM_IMPORT_ERROR:
    case VMStatus.PAUSED:
      statusClass = 'kubevirt-m-error';
      break;
    case VMStatus.VMI_WAITING:
    case VMStatus.STARTING:
      statusClass = 'kubevirt-m-not-ready';
      break;
    case VMStatus.DELETING:
    case VMStatus.STOPPING:
      statusClass = 'kubevirt-m-terminating';
      break;
    case VMStatus.MIGRATING:
    case VMStatus.RUNNING:
      statusClass = 'kubevirt-m-running';
      break;
    case VMStatus.STOPPED:
      statusClass = 'kubevirt-m-off';
      break;
    case VMStatus.V2V_CONVERSION_IN_PROGRESS:
    case VMStatus.V2V_VM_IMPORT_IN_PROGRESS:
    case VMStatus.CDI_IMPORTING:
      statusClass = 'kubevirt-m-importing';
      break;
    case VMStatus.UNKNOWN:
    default:
      statusClass = 'kubevirt-m-unknown';
  }

  const statusRect = (
    <rect
      className="kubevirt-vm-node__status"
      x={VM_STATUS_GAP}
      y={VM_STATUS_GAP}
      rx={VM_STATUS_RADIUS}
      ry={VM_STATUS_RADIUS}
      width={width - VM_STATUS_GAP * 2}
      height={height - VM_STATUS_GAP * 2}
    />
  );

  const imageProps = {
    x: width / 2 - iconRadius,
    y: height / 2 - iconRadius,
    width: iconRadius * 2,
    height: iconRadius * 2,
  };
  const imageComponent = osImage ? (
    <image {...imageProps} xlinkHref={osImage} />
  ) : (
    <VirtualMachineIcon {...imageProps} />
  );

  return (
    <g>
      <Tooltip
        content={tipContent}
        trigger="manual"
        isVisible={dropTarget && canDrop}
        animationDuration={0}
      >
        <BaseNode
          className={classNames('kubevirt-vm-node', statusClass)}
          kind={kind}
          element={element}
          dropTarget={dropTarget}
          canDrop={canDrop}
          {...rest}
        >
          {statusMessage ? <Tooltip content={statusMessage}>{statusRect}</Tooltip> : statusRect}
          <rect
            className="kubevirt-vm-node__bg"
            x={VM_STATUS_GAP + VM_STATUS_WIDTH}
            y={VM_STATUS_GAP + VM_STATUS_WIDTH}
            width={width - (VM_STATUS_GAP + VM_STATUS_WIDTH) * 2}
            height={height - (VM_STATUS_GAP + VM_STATUS_WIDTH) * 2}
          />
          {imageComponent}
          {children}
        </BaseNode>
      </Tooltip>
    </g>
  );
};

const VmNode = observer(ObservedVmNode);
export { VmNode };
