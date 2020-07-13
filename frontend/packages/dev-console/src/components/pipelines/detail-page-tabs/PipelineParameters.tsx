import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { MultiColumnField, InputField } from '@console/shared';

type PipelineParametersProps = {
  addLabel?: string;
  fieldName: string;
  isReadOnly?: boolean;
};

const PipelineParameters: React.FC<PipelineParametersProps> = (props) => {
  const { fieldName, isReadOnly = false } = props;
  const emptyMessage = 'No parameters are associated with this pipeline.';

  return (
    <MultiColumnField
      name={fieldName}
      headers={['Name', 'Description', 'Default Value']}
      emptyValues={{ name: '', description: '', default: '' }}
      emptyMessage={emptyMessage}
      isReadOnly={isReadOnly}
    >
      <InputField
        name="name"
        type={TextInputTypes.text}
        placeholder="Name"
        isReadOnly={isReadOnly}
      />
      <InputField
        name="description"
        type={TextInputTypes.text}
        placeholder="Description"
        isReadOnly={isReadOnly}
      />
      <InputField
        name="default"
        type={TextInputTypes.text}
        placeholder="Default Value"
        isReadOnly={isReadOnly}
      />
    </MultiColumnField>
  );
};

export default PipelineParameters;
