import * as React from 'react';
import * as classNames from 'classnames';
import { NativeTypes } from 'react-dnd-html5-backend';
import { DropTarget } from 'react-dnd';
import { ConnectDropTarget, DropTargetMonitor } from 'react-dnd/lib/interfaces';
import { Alert } from '@patternfly/react-core';
/* eslint-disable-next-line */
import { withTranslation, WithTranslation } from 'react-i18next';
import { isBinary } from 'istextorbinary';
import withDragDropContext from './drag-drop-context';

// Maximal file size, in bytes, that user can upload
const maxFileUploadSize = 4000000;

const getFileContent = (file: File): Promise<[string, boolean]> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result;
      const fileIsBinary = isBinary(file.name, Buffer.from(content));
      const stringContent = Buffer.from(content).toString(fileIsBinary ? 'base64' : 'utf-8');
      resolve([stringContent, fileIsBinary]);
    };
    reader.readAsArrayBuffer(file);
  });
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
    if (!file) {
      return;
    }
    if (file.size > maxFileUploadSize) {
      this.props.onChange({
        errorMessage: t('public~Maximum file size exceeded. File limit is 4MB.'),
      });
      return;
    }
    getFileContent(file)
      .then(([fileData, fileIsBinary]) => {
        this.props.onChange({
          fileData,
          fileIsBinary,
          fileName: file.name,
        });
      })
      .catch((e) => this.props.onChange({ errorMessage: e.toString() }));
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
            <div className="pf-v5-c-input-group">
              <input
                type="text"
                className="pf-v5-c-form-control"
                aria-label={t('public~Filename')}
                value={this.props.inputFileName}
                aria-describedby={this.props.inputFieldHelpText ? `${id}-help` : undefined}
                readOnly
                disabled
              />
              <span className="pf-v5-c-button pf-m-tertiary co-btn-file">
                <input id={id} type="file" onChange={this.onFileUpload} data-test="file-input" />
                {t('public~Browse...')}
              </span>
            </div>
            {this.props.inputFieldHelpText ? (
              <p className="help-block" id={`${id}-help`}>
                {this.props.inputFieldHelpText}
              </p>
            ) : null}
            {!hideContents && !fileIsBinary && (
              <textarea
                data-test-id={
                  this.props['data-test-id'] ? this.props['data-test-id'] : 'file-input-textarea'
                }
                className="pf-v5-c-form-control pf-m-resize-both co-file-dropzone__textarea"
                onChange={this.onDataChange}
                value={this.props.inputFileData}
                aria-label={this.props.label}
                aria-describedby={
                  this.props.textareaFieldHelpText ? `${id}-textarea-help` : undefined
                }
                required={isRequired}
              />
            )}
            {this.props.textareaFieldHelpText ? (
              <p className="help-block" id={`${id}-textarea-help`}>
                {this.props.textareaFieldHelpText}
              </p>
            ) : null}
            {errorMessage && <div className="text-danger">{errorMessage}</div>}
            {fileIsBinary && (
              <Alert
                isInline
                className="co-alert"
                variant="info"
                title={t('public~Non-printable file detected.')}
                data-test="alert-info"
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
      const { inputFileData, inputFileIsBinary } = props;
      this.state = {
        inputFileName: '',
        inputFileData: inputFileData || '',
        inputFileIsBinary: inputFileIsBinary || isBinary(null, inputFileData),
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
      getFileContent(file)
        .then(([inputFileData, inputFileIsBinary]) => {
          this.setState(
            {
              inputFileName: file.name,
              inputFileData,
              inputFileIsBinary,
              errorMessage: '',
            },
            () => this.props.onChange(inputFileData, inputFileIsBinary),
          );
        })
        .catch((e) =>
          this.setState(
            {
              errorMessage: e.toString(),
              inputFileData: '',
              inputFileName: '',
              inputFileIsBinary: false,
            },
            this.props.onChange('', false),
          ),
        );
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
  inputFileIsBinary?: boolean;
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
