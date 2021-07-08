import * as React from 'react';
import * as classNames from 'classnames';
import { NativeTypes } from 'react-dnd-html5-backend';
import { DropTarget } from 'react-dnd';
import { ConnectDropTarget, DropTargetMonitor } from 'react-dnd/lib/interfaces';
import { Alert } from '@patternfly/react-core';
/* eslint-disable-next-line */
import { withTranslation, WithTranslation } from 'react-i18next';

import withDragDropContext from './drag-drop-context';

// Maximal file size, in bytes, that user can upload
const maxFileUploadSize = 4000000;

export const containsNonPrintableCharacters = (value: string) => {
  if (!value) {
    return false;
  }
  // eslint-disable-next-line no-control-regex
  return /[\x00-\x09\x0E-\x1F]/.test(value);
};

class FileInputWithTranslation extends React.Component<FileInputProps, FileInputState> {
  constructor(props) {
    super(props);
    this.onDataChange = this.onDataChange.bind(this);
    this.onFileUpload = this.onFileUpload.bind(this);
  }
  onDataChange(event) {
    this.props.onChange({
      fileData: event.target.value,
    });
  }
  readFile(file) {
    const { t } = this.props;
    if (file.size > maxFileUploadSize) {
      this.props.onChange({
        errorMessage: t('public~Maximum file size exceeded. File limit is 4MB.'),
      });
      return;
    }
    let fileIsBinary = false;
    const reader = new FileReader();
    reader.onload = () => {
      const input = fileIsBinary
        ? (reader.result as string).split(',')[1]
        : (reader.result as string);
      // OnLoad, if inputFileIsBinary we have read as a binary string, skip next block
      if (containsNonPrintableCharacters(input) && !fileIsBinary) {
        fileIsBinary = true;
        reader.readAsDataURL(file);
      } else {
        this.props.onChange({
          fileData: input,
          fileIsBinary,
          fileName: file.name,
        });
      }
    };
    reader.readAsText(file, 'UTF-8');
  }
  onFileUpload(event) {
    this.readFile(event.target.files[0]);
  }
  render() {
    const {
      connectDropTarget,
      errorMessage,
      fileIsBinary,
      hideContents,
      isOver,
      canDrop,
      id,
      isRequired,
      t,
    } = this.props;
    const klass = classNames('co-file-dropzone-container', {
      'co-file-dropzone--drop-over': isOver,
    });
    return connectDropTarget(
      <div className="co-file-dropzone">
        {canDrop && (
          <div className={klass}>
            <p className="co-file-dropzone__drop-text">{t('public~Drop file here')}</p>
          </div>
        )}

        <div className="form-group">
          <label
            className={classNames('control-label', { 'co-required': isRequired })}
            htmlFor={id}
          >
            {this.props.label}
          </label>
          <div className="modal-body__field">
            <div className="pf-c-input-group">
              <input
                type="text"
                className="pf-c-form-control"
                value={this.props.inputFileName}
                aria-describedby={`${id}-help`}
                readOnly
                disabled
              />
              <span className="pf-c-button pf-m-tertiary co-btn-file">
                <input type="file" onChange={this.onFileUpload} data-test="file-input" />
                {t('public~Browse...')}
              </span>
            </div>
            <p className="help-block" id={`${id}-help`}>
              {this.props.inputFieldHelpText}
            </p>
            {!hideContents && (
              <textarea
                data-test-id={
                  this.props['data-test-id'] ? this.props['data-test-id'] : 'file-input-textarea'
                }
                className="pf-c-form-control co-file-dropzone__textarea"
                onChange={this.onDataChange}
                value={this.props.inputFileData}
                aria-describedby={`${id}-textarea-help`}
                required={isRequired}
              />
            )}
            <p className="help-block" id={`${id}-textarea-help`}>
              {this.props.textareaFieldHelpText}
            </p>
            {errorMessage && <div className="text-danger">{errorMessage}</div>}
            {fileIsBinary && (
              <Alert
                isInline
                className="co-alert"
                variant="info"
                title={t('public~Non-printable file detected.')}
              >
                {t('public~File contains non-printable characters. Preview is not available.')}
              </Alert>
            )}
          </div>
        </div>
      </div>,
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
export const FileInput = withTranslation()(FileInputWithTranslation);
const FileInputComponent = DropTarget(NativeTypes.FILE, boxTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop(),
}))(FileInput);

const DroppableFileInputWithTranslation = withDragDropContext(
  class DroppableFileInput extends React.Component<
    DroppableFileInputProps,
    DroppableFileInputState
  > {
    constructor(props) {
      super(props);
      this.state = {
        inputFileName: '',
        inputFileData: this.props.inputFileData || '',
        inputFileIsBinary: containsNonPrintableCharacters(this.props.inputFileData),
      };
      this.handleFileDrop = this.handleFileDrop.bind(this);
      this.onDataChange = this.onDataChange.bind(this);
    }
    handleFileDrop(item: any, monitor: DropTargetMonitor) {
      const { t } = this.props;
      if (!monitor) {
        return;
      }
      const file = monitor.getItem().files[0];
      if (file.size > maxFileUploadSize) {
        this.setState({
          errorMessage: t('public~Maximum file size exceeded. File limit is 4MB.'),
          inputFileName: '',
          inputFileData: '',
        });
        return;
      }
      let inputFileIsBinary = false;
      const reader = new FileReader();
      reader.onload = () => {
        const input = reader.result as string; // Note(Yaacov): we use reader.readAsText
        // OnLoad, if inputFileIsBinary we have read as a binary string, skip next block
        if (containsNonPrintableCharacters(input) && !inputFileIsBinary) {
          inputFileIsBinary = true;
          reader.readAsBinaryString(file);
        } else {
          this.setState(
            {
              inputFileName: file.name,
              inputFileData: input,
              inputFileIsBinary,
              errorMessage: '',
            },
            () => this.props.onChange(input, inputFileIsBinary),
          );
        }
      };
      reader.readAsText(file, 'UTF-8');
    }
    onDataChange(data) {
      const { fileData, fileIsBinary, fileName, errorMessage } = data;
      this.setState(
        {
          inputFileData: fileData || '',
          inputFileIsBinary: fileIsBinary,
          inputFileName: fileName || '',
          errorMessage: errorMessage || '',
        },
        () => this.props.onChange(this.state.inputFileData, fileIsBinary),
      );
    }
    render() {
      return (
        <FileInputComponent
          {...this.props}
          errorMessage={this.state.errorMessage}
          onDrop={this.handleFileDrop}
          onChange={this.onDataChange}
          inputFileData={this.state.inputFileData}
          inputFileName={this.state.inputFileName}
          fileIsBinary={this.state.inputFileIsBinary}
          hideContents={this.state.inputFileIsBinary}
        />
      );
    }
  },
);

export const DroppableFileInput = withTranslation()(DroppableFileInputWithTranslation);

export type DroppableFileInputProps = WithTranslation & {
  inputFileData: string;
  onChange: Function;
  label: string;
  id: string;
  inputFieldHelpText: string;
  textareaFieldHelpText: string;
  isRequired: boolean;
  hideContents?: boolean;
};

export type DroppableFileInputState = {
  inputFileData: string;
  inputFileIsBinary?: boolean;
  inputFileName: string;
  errorMessage?: any;
};

export type FileInputState = {
  inputFileData: string;
  inputFileName: string;
};

export type FileInputProps = WithTranslation & {
  errorMessage: string;
  connectDropTarget?: ConnectDropTarget;
  isOver?: boolean;
  canDrop?: boolean;
  onDrop: (props: FileInputProps, monitor: DropTargetMonitor) => void;
  inputFileData: string;
  inputFileName: string;
  onChange: Function;
  label: string;
  id: string;
  inputFieldHelpText: string;
  textareaFieldHelpText: string;
  isRequired: boolean;
  hideContents?: boolean;
  fileIsBinary?: boolean;
};
