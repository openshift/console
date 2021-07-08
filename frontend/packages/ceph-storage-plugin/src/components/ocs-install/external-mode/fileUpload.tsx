import * as React from 'react';
import { Button } from '@patternfly/react-core';
import './fileUpload.scss';

const FileUpload: React.FC<FileUploadProps> = (props) => {
  const { onUpload, role } = props;

  return (
    <div className="upload-component">
      <div className="input-btn">
        <Button href="#" variant="secondary" className="custom-input-btn">
          Browse
        </Button>
        <input
          type="file"
          id="inputButton"
          className="upload-btn__input"
          onChange={onUpload}
          aria-label="Upload File"
          role={role}
        />
      </div>
    </div>
  );
};

type FileUploadProps = {
  onUpload: (param: React.ChangeEvent<HTMLInputElement>) => void;
  role: string;
};

export default FileUpload;
