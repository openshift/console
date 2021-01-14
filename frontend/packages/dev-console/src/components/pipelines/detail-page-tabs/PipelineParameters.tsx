import * as React from 'react';
import { MultiParametersField } from './MultiParametersField';

type PipelineParametersProps = {
  addLabel?: string;
  fieldName: string;
  isReadOnly?: boolean;
};

const PipelineParameters: React.FC<PipelineParametersProps> = props => {
  const { fieldName } = props;

  return <MultiParametersField name={fieldName}></MultiParametersField>;
};

export default PipelineParameters;
