import * as React from 'react';
import { NativeTypes } from 'react-dnd-html5-backend';
import { DropTarget, DropTargetConnector } from 'react-dnd';
import { DropTargetMonitor } from 'react-dnd/lib/interfaces';
import { Model } from '@patternfly/react-topology';
import withDragDropContext from '@console/internal/components/utils/drag-drop-context';
import {
  FileUploadContextType,
  FileUploadContext,
} from '@console/app/src/components/file-upload/file-upload-context';
import TopologyView, { TopologyViewProps } from './TopologyView';
import { TopologyViewType } from '../../topology-types';

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
    const { setFileUpload, extensions } = React.useContext<FileUploadContextType>(
      FileUploadContext,
    );

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
