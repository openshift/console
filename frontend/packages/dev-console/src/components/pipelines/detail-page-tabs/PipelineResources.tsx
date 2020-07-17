import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { MultiColumnField, InputField, DropdownField } from '@console/shared';
import { pipelineResourceTypeSelections } from '../const';

type PipelineResourcesParam = {
  addLabel?: string;
  fieldName: string;
  isReadOnly?: boolean;
};

const PipelineResources: React.FC<PipelineResourcesParam> = (props) => {
  const { fieldName, isReadOnly = false } = props;
  const emptyMessage = 'No resources are associated with this pipeline.';
  return (
    <MultiColumnField
      name={fieldName}
      headers={['Name', 'Resource Type']}
      emptyValues={{ name: '', type: '' }}
      emptyMessage={emptyMessage}
      isReadOnly={isReadOnly}
    >
      <InputField
        name="name"
        type={TextInputTypes.text}
        placeholder="Name"
        isReadOnly={isReadOnly}
      />
      <DropdownField
        name="type"
        items={pipelineResourceTypeSelections}
        fullWidth
        disabled={isReadOnly}
      />
    </MultiColumnField>
  );
};

export default PipelineResources;
