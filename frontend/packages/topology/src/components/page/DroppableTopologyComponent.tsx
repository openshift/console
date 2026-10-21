import { useCallback, useContext } from 'react';
import type { MultipleFileUploadProps } from '@patternfly/react-core';
import { MultipleFileUpload } from '@patternfly/react-core';
import type { Model } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { FileUploadContext } from '@console/app/src/components/file-upload/file-upload-context';
import type { FileUploadContextType } from '@console/app/src/components/file-upload/file-upload-context';
import type { TopologyViewType } from '../../topology-types';
import TopologyView from './TopologyView';

export const DroppableTopologyComponent: React.FC<DroppableTopologyComponentProps> = (props) => {
  const { t } = useTranslation('topology');
  const { setFileUpload, extensions } = useContext<FileUploadContextType>(FileUploadContext);
  const fileTypes = extensions.map((ex) => `.${ex}`).toString();

  const canDropFile = extensions.length > 0;

  const handleFileDrop = useCallback<MultipleFileUploadProps['onFileDrop']>(
    (_event, files) => {
      const [file] = files;
      if (file) {
        setFileUpload(file);
      }
    },
    [setFileUpload],
  );

  if (!canDropFile) {
    return <TopologyView {...props} />;
  }

  return (
    <MultipleFileUpload
      style={{ display: 'contents' }}
      onFileDrop={handleFileDrop}
      dropzoneProps={{
        noClick: true,
        noKeyboard: true,
      }}
    >
      <div className="co-file-dropzone co-file-dropzone__flex">
        <div className="co-file-dropzone-container">
          <span className="co-file-dropzone__drop-text">
            {t('Drop file ({{fileTypes}}) here', { fileTypes })}
          </span>
        </div>
        <TopologyView {...props} />
      </div>
    </MultipleFileUpload>
  );
};

export type DroppableTopologyComponentProps = {
  model: Model;
  namespace: string;
  viewType: TopologyViewType;
};
