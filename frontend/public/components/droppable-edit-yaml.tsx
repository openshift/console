import withDragDropContext from './utils/drag-drop-context';
import * as React from 'react';

import { EditYAML } from './edit-yaml';
import { NativeTypes } from 'react-dnd-html5-backend';
import { DropTarget } from 'react-dnd';

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
}))(EditYAML);


export const DroppableEditYAML = withDragDropContext(class DroppableEditYAML extends React.Component<DroppableEditYAMLProps, DroppableEditYAMLState> {
  constructor(props) {
    super(props);
    this.state = {
      fileUpload: '',
      error: '',
    };
    this.handleFileDrop = this.handleFileDrop.bind(this);
  }

  containsNonPrintableCharacters(value: string) {
    if (!value) {
      return false;
    }
    // eslint-disable-next-line no-control-regex
    return /[\x00-\x09\x0E-\x1F]/.test(value);
  }

  handleFileDrop(item, monitor) {
    if (!monitor) {
      return;
    }
    const file = monitor.getItem().files[0];
    // limit size size uploading to 1 mb
    if (file.size <= maxFileUploadSize) {
      const reader = new FileReader();
      reader.onload = () => {
        const input = reader.result as string;
        if (this.containsNonPrintableCharacters(input)) {
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
    return <EditYAMLComponent
      {...this.props}
      obj={obj}
      fileUpload={fileUpload}
      error={error}
      onDrop={this.handleFileDrop} />;
  }
});

export type DroppableEditYAMLProps = {
  obj: string,
};

export type DroppableEditYAMLState = {
  fileUpload: string | ArrayBuffer,
  error: string,
};
