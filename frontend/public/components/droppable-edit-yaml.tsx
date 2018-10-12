import withDragDropContext from './utils/drag-drop-context';
import * as React from 'react';
import {EditYAML} from './edit-yaml';
import { NativeTypes } from 'react-dnd-html5-backend';
// eslint-disable-next-line no-unused-vars
import { DropTarget } from 'react-dnd';

// Maximal file size, in bytes, that user can upload
const maxFileUploadSize = 4000000;
const fileSizeErrorMsg = 'Maximum file size exceeded. File limit is 4MB.';

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
      obj: this.props.obj || '',
      error: '',
    };
    this.handleFileDrop = this.handleFileDrop.bind(this);
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
        const input = reader.result;
        this.setState({
          obj: input,
        });
      };
      reader.readAsText(file, 'UTF-8');
    } else {
      this.setState({
        error: fileSizeErrorMsg,
      });
    }

  }
  render() {
    return <EditYAMLComponent
      {...this.props}
      obj={this.state.obj}
      error={this.state.error}
      onDrop={this.handleFileDrop} />;
  }
});

/* eslint-disable no-undef */
export type DroppableEditYAMLProps = {
  obj: string,
};
export type DroppableEditYAMLState = {
  obj: string,
  error: string,
};
