import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { MultiColumnField, InputField, DropdownField } from '@console/shared';
import { PipelineResourceType } from '../const';

type PipelineResourcesParam = {
  addLabel?: string;
  fieldName: string;
  isReadOnly?: boolean;
};

const PipelineResources: React.FC<PipelineResourcesParam> = (props) => {
  const { addLabel = 'Add Pipeline Resource', fieldName, isReadOnly = false } = props;
  const emptyMessage = 'No resources are associated with this pipeline.';
  return (
    <MultiColumnField
      name={fieldName}
      addLabel={addLabel}
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
      <DropdownField name="type" items={PipelineResourceType} fullWidth disabled={isReadOnly} />
    </MultiColumnField>
  );
};

export default PipelineResources;
