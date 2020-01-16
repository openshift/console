import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { MultiColumnField, InputField } from '@console/shared';

type PipelineParametersProps = {
  addLabel?: string;
  fieldName: string;
  isReadOnly?: boolean;
};

const PipelineParameters: React.FC<PipelineParametersProps> = (props) => {
  const { addLabel = 'Add Pipeline Params', fieldName, isReadOnly = false } = props;

  return (
    <MultiColumnField
      name={fieldName}
      addLabel={addLabel}
      headers={['Name', 'Description', 'Default Value']}
      emptyValues={{ name: '', description: '', default: '' }}
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
