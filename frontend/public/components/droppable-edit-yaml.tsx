/* eslint-disable @typescript-eslint/no-use-before-define */
import * as React from 'react';
import * as _ from 'lodash-es';
import { NativeTypes } from 'react-dnd-html5-backend';
import { DropTarget } from 'react-dnd';
import { ResourceYAMLEditorProps } from '@console/dynamic-plugin-sdk';

import { EditYAML } from './edit-yaml';
import withDragDropContext from './utils/drag-drop-context';
import { DropTargetMonitor } from 'react-dnd/lib/interfaces';
import { isBinary } from 'istextorbinary/edition-es2017';

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

type DroppableEditYAMLProps = ResourceYAMLEditorProps & {
  allowMultiple?: boolean;
  isCodeImportRedirect?: boolean;
};

// Prevents SDK users from passing additional props
export const ResourceYAMLEditor: React.FC<ResourceYAMLEditorProps> = ({
  initialResource,
  header,
  onSave,
  readOnly,
  create,
  onChange,
  hideHeader,
}) => (
  <DroppableEditYAML
    initialResource={initialResource}
    header={header}
    onSave={onSave}
    readOnly={readOnly}
    create={create}
    onChange={onChange}
    hideHeader={hideHeader}
  />
);

export const DroppableEditYAML = withDragDropContext<DroppableEditYAMLProps>(
  class DroppableEditYAML extends React.Component<DroppableEditYAMLProps, DroppableEditYAMLState> {
    private fileUploadContents: string = '';
    constructor(props) {
      super(props);
      this.state = {
        fileUpload: '',
        errors: [],
      };
      this.handleFileDrop = this.handleFileDrop.bind(this);
      this.clearFileUpload = this.clearFileUpload.bind(this);
    }

    addDocument(newFileContent: string) {
      this.fileUploadContents = _.isEmpty(this.fileUploadContents)
        ? newFileContent
        : `${this.fileUploadContents}\n---\n${newFileContent}`;
    }

    readFileContents(file, lastFile) {
      // If unsupported file type is dropped into drop zone, file will be undefined
      if (!file) {
        return;
      }
      // limit size size uploading to 1 mb
      if (file.size <= maxFileUploadSize) {
        const reader = new FileReader();
        reader.onload = () => {
          const buffer = Buffer.from(reader.result);
          if (isBinary(null, buffer)) {
            this.setState((previousState) => ({
              errors: [...previousState.errors, `Ignoring ${file.name}: ${fileTypeErrorMsg}`],
            }));
          } else {
            this.addDocument(buffer.toString().trim());
            if (lastFile) {
              this.setState({ fileUpload: this.fileUploadContents });
            }
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        this.setState((previousState) => ({
          errors: [...previousState.errors, `Ignoring ${file.name}: ${fileSizeErrorMsg}`],
        }));
      }
    }

    handleFileDrop(item, monitor) {
      const { allowMultiple } = this.props;
      if (!monitor) {
        return;
      }
      this.clearFileUpload();
      if (allowMultiple) {
        monitor.getItem().files.forEach((yamlFile, i) => {
          this.readFileContents(yamlFile, i === monitor.getItem().files.length - 1);
        });
      } else {
        const [file] = monitor.getItem().files;
        this.readFileContents(file, true);
      }
    }

    clearFileUpload() {
      this.setState({ fileUpload: '', errors: [] });
      this.fileUploadContents = '';
    }

    render() {
      const {
        allowMultiple,
        initialResource,
        create = false,
        onChange = () => null,
        hideHeader = false,
        isCodeImportRedirect = false,
      } = this.props;
      const { errors, fileUpload } = this.state;
      return (
        <EditYAMLComponent
          {...this.props}
          allowMultiple={allowMultiple}
          obj={initialResource}
          fileUpload={fileUpload}
          error={errors.join('\n')}
          onDrop={this.handleFileDrop}
          clearFileUpload={this.clearFileUpload}
          create={create}
          onChange={onChange}
          hideHeader={hideHeader}
          isCodeImportRedirect={isCodeImportRedirect}
        />
      );
    }
  },
);

type EditYAMLProps = {
  allowMultiple?: boolean;
  obj: ResourceYAMLEditorProps['initialResource'];
  fileUpload: string;
  error: string;
  onDrop: (item: any, monitor: DropTargetMonitor) => void;
  clearFileUpload: () => void;
  create?: boolean;
  onChange?: (content: string) => void;
  hideHeader?: boolean;
  isCodeImportRedirect?: boolean;
};

export type DroppedFile = {
  error?: string;
  id: string;
  name: string;
  size: number;
};

export type DroppableEditYAMLState = {
  errors: string[];
  fileUpload: string;
};
