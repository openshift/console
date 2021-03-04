import * as React from 'react';
import { FileUpload } from '@patternfly/react-core';
import BaseFileUpload from './BaseFileUpload';
import { BaseFileUploadProps } from './field-types';

const FileUploadField: React.FunctionComponent<BaseFileUploadProps> = ({ ...baseProps }) => {
  return <BaseFileUpload {...baseProps}>{(props) => <FileUpload {...props} />}</BaseFileUpload>;
};

export default FileUploadField;
