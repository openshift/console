import withDragDropContext from './utils/drag-drop-context';
import { containsNonPrintableCharacters } from './utils/file-input';
import * as React from 'react';

import { EditYAML } from './edit-yaml';
import { NativeTypes } from 'react-dnd-html5-backend';
import { DropTarget } from 'react-dnd';
import { DropTargetMonitor } from 'react-dnd/lib/interfaces';

// Maximal file size, in bytes, that user can upload
const maxFileUploadSize = 4000000;
const fileSizeErrorMsg = 'Maximum file size exceeded. File limit is 4MB.';
const fileTypeErrorMsg = 'Binary file detected. Edit text based YAML files only.';

const boxTarget = {
  drop(props, monitor) {
    if (props.onDrop && monitor.isOver()) {
      props.onDrop(props, monitor);
    }
  },
};

const EditYAMLComponent = DropTarget(NativeTypes.FILE, boxTarget, (connectObj, monitor) => ({
  connectDropTarget: connectObj.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop(),
}))(EditYAML as React.FC<EditYAMLProps>);

export const DroppableEditYAML = withDragDropContext<DroppableEditYAMLProps>(
  class DroppableEditYAML extends React.Component<DroppableEditYAMLProps, DroppableEditYAMLState> {
    constructor(props) {
      super(props);
      this.state = {
        fileUpload: '',
        error: '',
      };
      this.handleFileDrop = this.handleFileDrop.bind(this);
    }

    handleFileDrop(item, monitor) {
      if (!monitor) {
        return;
      }
      const [file] = monitor.getItem().files;

      // If unsupported file type is dropped into drop zone, file will be undefined
      if (!file) {
        return;
      }

      // limit size size uploading to 1 mb
      if (file.size <= maxFileUploadSize) {
        const reader = new FileReader();
        reader.onload = () => {
          const input = reader.result as string;
          if (containsNonPrintableCharacters(input)) {
            this.setState({
              error: fileTypeErrorMsg,
            });
          } else {
            this.setState({
              fileUpload: input,
              error: '',
            });
          }
        };
        reader.readAsText(file, 'UTF-8');
      } else {
        this.setState({
          error: fileSizeErrorMsg,
        });
      }
    }

    render() {
      const { obj } = this.props;
      const { fileUpload, error } = this.state;
      return (
        <EditYAMLComponent
          {...this.props}
          obj={obj}
          fileUpload={fileUpload}
          error={error}
          onDrop={this.handleFileDrop}
        />
      );
    }
  },
);

type EditYAMLProps = {
  obj: string;
  fileUpload: string;
  error: string;
  onDrop: (item: any, monitor: DropTargetMonitor) => void;
};

export type DroppableEditYAMLProps = {
  obj: string;
};

export type DroppableEditYAMLState = {
  fileUpload: string;
  error: string;
};
