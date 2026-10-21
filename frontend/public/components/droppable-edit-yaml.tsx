import type { FC } from 'react';
import { useState, useCallback } from 'react';
import { ResourceYAMLEditorProps } from '@console/dynamic-plugin-sdk';
import { isText } from 'istextorbinary';

import { EditYAML, EditYAMLProps } from './edit-yaml';
import {
  DropEvent,
  DropzoneErrorCode,
  MultipleFileUpload,
  MultipleFileUploadProps,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { units } from './utils/units';

// Maximal file size, in bytes, that user can upload
const maxFileUploadSize = 4000000;

export type DroppedFile = {
  error?: string;
  id: string;
  name: string;
  size: number;
};

type DroppableEditYAMLProps = ResourceYAMLEditorProps & {
  allowMultiple?: boolean;
  isCodeImportRedirect?: boolean;
};

const useDropErrorMessage = (): ((errorCode: DropzoneErrorCode, fileName: string) => string) => {
  const { t } = useTranslation('public');

  return useCallback(
    (errorCode, fileName) => {
      switch (errorCode) {
        case 'file-too-large':
          return t(
            'Ignoring {{ fileName }}: Maximum file size exceeded. File limit is {{ size }}.',
            {
              fileName,
              size: units.humanize(maxFileUploadSize, 'decimalBytes', true).string,
            },
          );
        case 'too-many-files':
          return t('Ignoring {{ fileName }}: Too many files. Maximum one file can be uploaded.', {
            fileName,
          });
        case 'file-invalid-type':
          return t(
            'Ignoring {{ fileName }}: Invalid file type. Only text based YAML files are supported.',
            {
              fileName,
            },
          );
        default:
          return t('An error occurred while uploading {{ fileName }}.', {
            fileName,
          });
      }
    },
    [t],
  );
};

export const DroppableEditYAML: FC<DroppableEditYAMLProps & EditYAMLProps> = ({
  allowMultiple,
  initialResource,
  create = false,
  onChange = () => null,
  hideHeader = false,
  isCodeImportRedirect = false,
  ...props
}) => {
  const { t } = useTranslation('public');
  const getDropErrorMessage = useDropErrorMessage();

  const [fileUpload, setFileUpload] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const clearFileUpload = useCallback(() => {
    setFileUpload('');
    setErrors([]);
  }, [setFileUpload, setErrors]);

  const onFileDrop = useCallback(
    (event: DropEvent, files: File[]) => {
      event.preventDefault();
      clearFileUpload();
      const fileAcc = [];

      files.forEach((yamlFile: File, i: number) => {
        if (!yamlFile) {
          return;
        }
        const lastFile = i === files.length - 1;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const arrayBuffer = ev.target.result as ArrayBuffer;
          const buffer = Buffer.from(new Uint8Array(arrayBuffer));

          if (isText(null, buffer)) {
            fileAcc.push(buffer.toString().trim());

            if (!lastFile) {
              fileAcc.push('---');
            } else {
              setFileUpload(fileAcc.join('\n'));
            }
          }
        };
        reader.readAsArrayBuffer(yamlFile);
      });
    },
    [clearFileUpload],
  );

  const onDropRejected: MultipleFileUploadProps['dropzoneProps']['onDropRejected'] = useCallback(
    (rejections) => {
      setErrors(
        rejections.map((rejection) => {
          return getDropErrorMessage(
            rejection.errors[0].code as DropzoneErrorCode,
            rejection.file.name,
          );
        }),
      );
    },
    [getDropErrorMessage],
  );

  return (
    <MultipleFileUpload
      dropzoneProps={{
        maxFiles: allowMultiple ? undefined : 1,
        maxSize: maxFileUploadSize,
        onDrop: (acceptedFiles, fileRejections, event) => {
          clearFileUpload();

          if (fileRejections.length > 0) {
            onDropRejected(fileRejections, event);
          }
          if (acceptedFiles.length > 0) {
            onFileDrop(event, acceptedFiles as File[]);
          }
        },
        accept: {
          'application/yaml': ['.yaml', '.yml'],
        },
      }}
      style={{ display: 'contents' }}
    >
      <div className="co-file-dropzone co-file-dropzone__flex">
        <div className="co-file-dropzone-container">
          <p className="co-file-dropzone__drop-text">{t('Drop file here')}</p>
        </div>
        <EditYAML
          {...props}
          allowMultiple={allowMultiple}
          obj={initialResource}
          fileUpload={fileUpload}
          error={errors.join('\n')}
          clearFileUpload={clearFileUpload}
          create={create}
          onChange={onChange}
          hideHeader={hideHeader}
          isCodeImportRedirect={isCodeImportRedirect}
        />
      </div>
    </MultipleFileUpload>
  );
};

// Prevents SDK users from passing additional props
export const ResourceYAMLEditor: FC<ResourceYAMLEditorProps> = ({
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
