import * as React from 'react';
import * as _ from 'lodash-es';
import { NativeTypes } from 'react-dnd-html5-backend';
import { DropTarget } from 'react-dnd';

import { EditYAML } from './edit-yaml';
import withDragDropContext from './utils/drag-drop-context';
import { DropTargetMonitor } from 'react-dnd/lib/interfaces';
import { containsNonPrintableCharacters } from './utils/file-input';

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
        files: [],
        fileUpload: '',
        errors: [],
      };
      this.handleFileDrop = this.handleFileDrop.bind(this);
      this.clearFileUpload = this.clearFileUpload.bind(this);
    }

    addDocument(existingEditorContent: string, newFileContent: string) {
      return existingEditorContent
        ? `${existingEditorContent}\n---\n${newFileContent}`
        : newFileContent;
    }

    readFileContents(file) {
      const { allowMultiple } = this.props;
      // If unsupported file type is dropped into drop zone, file will be undefined
      if (!file) {
        return;
      }
      const currentFile: DroppedFile = {
        id: _.uniqueId(),
        name: file.name,
        size: file.size,
      };
      // limit size size uploading to 1 mb
      if (file.size <= maxFileUploadSize) {
        const reader = new FileReader();
        reader.onload = () => {
          const input = reader.result as string;
          if (containsNonPrintableCharacters(input)) {
            this.setState((previousState) => ({
              errors: [...previousState.errors, `Ignoring ${file.name}: ${fileTypeErrorMsg}`],
            }));
          } else {
            this.setState((previousState) => ({
              fileUpload: allowMultiple
                ? this.addDocument(previousState.fileUpload, input.trim())
                : input,
              files: [...previousState.files, currentFile],
            }));
          }
        };
        reader.readAsText(file, 'UTF-8');
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
      this.setState({ errors: [] });
      if (allowMultiple) {
        monitor.getItem().files.forEach((yamlFile) => {
          this.readFileContents(yamlFile);
        });
      } else {
        const [file] = monitor.getItem().files;
        this.readFileContents(file);
      }
    }

    clearFileUpload() {
      this.setState({ fileUpload: '', errors: [] });
    }

    render() {
      const { allowMultiple, obj } = this.props;
      const { fileUpload, errors } = this.state;

      return (
        <EditYAMLComponent
          {...this.props}
          allowMultiple={allowMultiple}
          obj={obj}
          fileUpload={fileUpload}
          error={errors.join('\n')}
          onDrop={this.handleFileDrop}
          clearFileUpload={this.clearFileUpload}
        />
      );
    }
  },
);

type EditYAMLProps = {
  allowMultiple?: boolean;
  obj: string;
  fileUpload: string;
  error: string;
  onDrop: (item: any, monitor: DropTargetMonitor) => void;
  clearFileUpload: () => void;
};

export type DroppableEditYAMLProps = {
  allowMultiple?: boolean;
  obj: string;
};

export type DroppedFile = {
  error?: string;
  id: string;
  name: string;
  size: number;
};

export type DroppableEditYAMLState = {
  errors: string[];
  files?: DroppedFile[];
  fileUpload: string;
};
