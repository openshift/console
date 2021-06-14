import * as React from 'react';
import { Model } from '@patternfly/react-topology';
import { DropTarget, DropTargetConnector } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import { DropTargetMonitor } from 'react-dnd/lib/interfaces';
import {
  FileUploadContextType,
  FileUploadContext,
} from '@console/app/src/components/file-upload/file-upload-context';
import withDragDropContext from '@console/internal/components/utils/drag-drop-context';
import { TopologyViewType } from '../../topology-types';
import TopologyView, { TopologyViewProps } from './TopologyView';

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
