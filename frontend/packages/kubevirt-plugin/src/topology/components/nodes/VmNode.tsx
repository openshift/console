import * as React from 'react';
import * as classNames from 'classnames';
import { Tooltip } from '@patternfly/react-core';
import { VirtualMachineIcon } from '@patternfly/react-icons';
import {
  Node,
  observer,
  WithSelectionProps,
  WithContextMenuProps,
  WithCreateConnectorProps,
  WithDragNodeProps,
  WithDndDropProps,
  useCombineRefs,
  createSvgIdUrl,
  useHover,
  useAnchor,
  RectAnchor,
  NodeModel,
} from '@patternfly/react-topology';
import { getLabelsAsString } from '@console/shared';
import { useAccessReview } from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import SvgBoxedText from '@console/dev-console/src/components/svg/SvgBoxedText';
import {
  useDisplayFilters,
  getResource,
  useSearchFilter,
  useAllowEdgeCreation,
  NODE_SHADOW_FILTER_ID,
  NODE_SHADOW_FILTER_ID_HOVER,
  NodeShadows,
  TopologyDataObject,
  getFilterById,
  SHOW_LABELS_FILTER_ID,
} from '@console/dev-console/src/components/topology';
import './VmNode.scss';
import { VMStatus } from '../../../constants/vm/vm-status';
import { VMNodeData } from '../../types';

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

const VM_NODE_RADIUS = 10;
const VM_STATUS_GAP = 7;
const VM_STATUS_WIDTH = 7;
const VM_STATUS_RADIUS = 7;

const ObservedVmNode: React.FC<VmNodeProps> = ({
  element,
  dragNodeRef,
  dndDropRef,
  canDrop,
  dragging,
  edgeDragging,
  dropTarget,
  selected,
  onSelect,
  onContextMenu,
  contextMenuOpen,
  onHideCreateConnector,
  onShowCreateConnector,
}) => {
  const [hover, hoverRef] = useHover();
  useAnchor(RectAnchor);
  const refs = useCombineRefs<SVGEllipseElement>(hoverRef, dragNodeRef);
  const { width, height } = element.getBounds();
  const vmData = element.getData().data;
  const { kind, osImage, vmStatusBundle } = vmData;
  const displayFilters = useDisplayFilters();
  const allowEdgeCreation = useAllowEdgeCreation();
  const [filtered] = useSearchFilter(element.getLabel(), getLabelsAsString(getResource(element)));
  const iconRadius = Math.min(width, height) * 0.25;
  const showLabelsFilter = getFilterById(SHOW_LABELS_FILTER_ID, displayFilters);
  const showLabels = showLabelsFilter?.value || hover;
  const tipContent = `Create a visual connector`;
  const resourceObj = getResource(element);
  const resourceModel = modelFor(referenceFor(resourceObj));
  const editAccess = useAccessReview({
    group: resourceModel.apiGroup,
    verb: 'patch',
    resource: resourceModel.plural,
    name: resourceObj.metadata.name,
    namespace: resourceObj.metadata.namespace,
  });

  React.useLayoutEffect(() => {
    if (editAccess && allowEdgeCreation) {
      if (hover) {
        onShowCreateConnector && onShowCreateConnector();
      } else {
        onHideCreateConnector && onHideCreateConnector();
      }
    }
  }, [hover, onShowCreateConnector, onHideCreateConnector, editAccess, allowEdgeCreation]);

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
    case VMStatus.STOPPING:
      statusClass = 'kubevirt-m-terminating';
      break;
    case VMStatus.MIGRATING:
    case VMStatus.RUNNING:
      statusClass = 'kubevirt-m-running';
      break;
    case VMStatus.OFF:
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
        <g
          className={classNames('odc-base-node kubevirt-vm-node', statusClass, {
            'is-hover': hover || contextMenuOpen,
            'is-highlight': canDrop,
            'is-dragging': dragging || edgeDragging,
            'is-dropTarget': canDrop && dropTarget,
            'is-filtered': filtered,
            'is-selected': selected,
          })}
        >
          <NodeShadows />
          <g
            data-test-id="base-node-handler"
            onClick={onSelect}
            onContextMenu={editAccess ? onContextMenu : null}
            ref={refs}
          >
            <rect
              className="odc-base-node__bg"
              ref={dndDropRef}
              x={0}
              y={0}
              rx={VM_NODE_RADIUS}
              ry={VM_NODE_RADIUS}
              width={width}
              height={height}
              filter={createSvgIdUrl(
                hover || dragging || edgeDragging || dropTarget || contextMenuOpen
                  ? NODE_SHADOW_FILTER_ID_HOVER
                  : NODE_SHADOW_FILTER_ID,
              )}
            />
            {statusMessage ? <Tooltip content={statusMessage}>{statusRect}</Tooltip> : statusRect}
            <rect
              className="kubevirt-vm-node__bg"
              x={VM_STATUS_GAP + VM_STATUS_WIDTH}
              y={VM_STATUS_GAP + VM_STATUS_WIDTH}
              width={width - (VM_STATUS_GAP + VM_STATUS_WIDTH) * 2}
              height={height - (VM_STATUS_GAP + VM_STATUS_WIDTH) * 2}
            />
            {imageComponent}
            {showLabels && (vmData.kind || element.getLabel()) && (
              <SvgBoxedText
                className="odc-base-node__label"
                x={width / 2}
                y={height + 24}
                paddingX={8}
                paddingY={4}
                kind={kind}
              >
                {element.getLabel()}
              </SvgBoxedText>
            )}
          </g>
        </g>
      </Tooltip>
    </g>
  );
};

const VmNode = observer(ObservedVmNode);
export { VmNode };
