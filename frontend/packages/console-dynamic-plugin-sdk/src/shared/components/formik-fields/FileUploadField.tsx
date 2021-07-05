import * as React from 'react';
import { FileUpload } from '@patternfly/react-core';
import BaseInputField from './BaseInputField';
import { BaseInputFieldProps } from './field-types';

const FileUploadField: React.FunctionComponent<Omit<BaseInputFieldProps, 'onChange'> &
  React.ComponentProps<typeof FileUpload>> = ({ onChange, ...baseProps }) => {
  const onChangeHandle = (
    valueData: string | File,
    filenameData: string,
    events:
      | React.DragEvent<HTMLElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    onChange?.(valueData, filenameData, events);
  };
  return (
    <BaseInputField {...baseProps}>
      {(props) => <FileUpload {...props} onChange={onChangeHandle} id={baseProps.id} />}
    </BaseInputField>
  );
};

export default FileUploadField;
