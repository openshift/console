import { useContext } from 'react';
import type { Model } from '@patternfly/react-topology';
import type { DropTargetConnector } from 'react-dnd';
import { DropTarget } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import type { DropTargetMonitor } from 'react-dnd/lib/interfaces';
import type { FileUploadContextType } from '@console/app/src/components/file-upload/file-upload-context';
import { FileUploadContext } from '@console/app/src/components/file-upload/file-upload-context';
import withDragDropContext from '@console/internal/components/utils/drag-drop-context';
import type { TopologyViewType } from '../../topology-types';
import type { TopologyViewProps } from './TopologyView';
import TopologyView from './TopologyView';

const boxTarget = {
  drop(props, monitor) {
    if (props.onDrop && monitor.isOver()) {
      props.onDrop(monitor);
    }
  },
};

const DroppableTopology = DropTarget(
  NativeTypes.FILE,
  boxTarget,
  (connectObj: DropTargetConnector, monitor: DropTargetMonitor, props: TopologyViewProps) => {
    return {
      connectDropTarget: connectObj.dropTarget(),
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop() && props.canDropFile,
    };
  },
)(TopologyView);

export const DroppableTopologyComponent = withDragDropContext<DroppableTopologyComponentProps>(
  (props) => {
    const { setFileUpload, extensions } = useContext<FileUploadContextType>(FileUploadContext);

    const handleFileDrop = (monitor: DropTargetMonitor) => {
      if (!monitor) {
        return;
      }
      const [file] = monitor.getItem().files;
      if (!file) {
        return;
      }
      setFileUpload(file);
    };

    return (
      <DroppableTopology {...props} onDrop={handleFileDrop} canDropFile={extensions.length > 0} />
    );
  },
);

export type DroppableTopologyComponentProps = {
  model: Model;
  namespace: string;
  viewType: TopologyViewType;
};
