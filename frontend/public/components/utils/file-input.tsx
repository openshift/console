import * as React from 'react';
import * as classNames from 'classnames';
import { NativeTypes } from 'react-dnd-html5-backend';
// eslint-disable-next-line no-unused-vars
import { DropTarget, ConnectDropTarget, DropTargetMonitor } from 'react-dnd';
import withDragDropContext from './drag-drop-context';

export class FileInput extends React.Component<FileInputProps, FileInputState> {
  constructor(props) {
    super(props);
    this.onDataChange = this.onDataChange.bind(this);
    this.onFileUpload = this.onFileUpload.bind(this);
  }
  onDataChange(event) {
    this.props.onChange(event.target.value);
  }
  readFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const input = reader.result;
      this.props.onChange(input, file.name);
    };
    reader.readAsText(file, 'UTF-8');
  }
  onFileUpload(event) {
    this.readFile(event.target.files[0]);
  }
  render() {
    const { connectDropTarget, isOver, canDrop, id } = this.props;
    const klass = classNames('co-file-dropzone-container', {'co-file-dropzone--drop-over': isOver});
    return (
      connectDropTarget(
        <div className="co-file-dropzone">
          { canDrop && <div className={klass}><p className="co-file-dropzone__drop-text">Drop file here</p></div> }

          <div className="form-group">
            <label className="control-label" htmlFor={id}>{this.props.label}</label>
            <div className="modal-body__field">
              <div className="input-group">
                <input type="text"
                  className="form-control"
                  value={this.props.inputFileName}
                  aria-describedby={`${id}-help`}
                  readOnly
                  disabled />
                <span className="input-group-btn">
                  <span className="btn btn-default co-btn-file">
                    Browse&hellip;
                    <input type="file" onChange={this.onFileUpload} className="form-control" />
                  </span>
                </span>
              </div>
              <p className="help-block" id={`${id}-help`}>{this.props.inputFieldHelpText}</p>
              <textarea className="form-control co-file-dropzone__textarea"
                onChange={this.onDataChange}
                value={this.props.inputFileData}
                aria-describedby={`${id}-textarea-help`}
                required>
              </textarea>
              <p className="help-block" id={`${id}-textarea-help`}>{this.props.textareaFieldHelpText}</p>
            </div>
          </div>
        </div>
      )
    );
  }
}

const boxTarget = {
  drop(props: FileInputProps, monitor: DropTargetMonitor) {
    if (props.onDrop && monitor.isOver()) {
      props.onDrop(props, monitor);
    }
  },
};

const FileInputComponent = DropTarget(NativeTypes.FILE, boxTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop()
}))(FileInput);

export const DroppableFileInput = withDragDropContext(class DroppableFileInput extends React.Component<DroppableFileInputProps, DroppableFileInputState>{
  constructor(props) {
    super(props);
    this.state = {
      inputFileName: '',
      inputFileData: this.props.inputFileData || '',
    };
    this.handleFileDrop = this.handleFileDrop.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
  }
  handleFileDrop(item: any, monitor: DropTargetMonitor) {
    if (!monitor) {
      return;
    }
    const file = monitor.getItem().files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const input = reader.result;
      this.setState({
        inputFileName: file.name,
        inputFileData: input
      }, () => this.props.onChange(input));
    };
    reader.readAsText(file, 'UTF-8');
  }
  onDataChange(fileData, fileName) {
    this.setState({
      inputFileData: fileData,
      inputFileName: !fileName ? '' : fileName
    }, () => this.props.onChange(fileData));
  }
  render() {
    return <FileInputComponent
      {...this.props}
      onDrop={this.handleFileDrop}
      onChange={this.onDataChange}
      inputFileData={this.state.inputFileData}
      inputFileName={this.state.inputFileName} />;
  }
});
/* eslint-disable no-undef */
export type DroppableFileInputProps = {
  inputFileData: string,
  onChange: Function,
  label: string,
  id: string,
  inputFieldHelpText: string,
  textareaFieldHelpText: string,
};
export type DroppableFileInputState = {
  inputFileData: string,
  inputFileName: string,
};
export type FileInputState = {
  inputFileData: string,
  inputFileName: string,
};
export type FileInputProps = {
  connectDropTarget?: ConnectDropTarget,
  isOver?: boolean,
  canDrop?: boolean,
  onDrop: (props: FileInputProps, monitor: DropTargetMonitor) => void,
  inputFileData: string,
  inputFileName: string,
  onChange: Function,
  label: string,
  id: string,
  inputFieldHelpText: string,
  textareaFieldHelpText: string,
};
/* eslint-enable no-undef */
