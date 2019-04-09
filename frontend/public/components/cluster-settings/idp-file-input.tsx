/* eslint-disable no-undef, no-unused-vars */
import * as React from 'react';
import { AsyncComponent } from '../utils';

const DroppableFileInput = (props: any) => <AsyncComponent loader={() => import('../utils/file-input').then(c => c.DroppableFileInput)} {...props} />;

export const IDPFileInput: React.FC<IDPFileInputProps> = ({value, onChange, label='CA File', helpText, isRequired=false}) => (
  <div className="form-group">
    <DroppableFileInput
      onChange={onChange}
      inputFileData={value}
      id="idp-file-input"
      label={label}
      inputFieldHelpText={helpText}
      isRequired={isRequired}
      hideContents />
  </div>
);

type IDPFileInputProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  helpText?: string;
  isRequired?: boolean;
};
