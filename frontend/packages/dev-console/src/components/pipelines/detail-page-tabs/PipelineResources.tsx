import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { MultiColumnField, InputField, DropdownField } from '@console/shared';

enum resourceTypes {
  '' = 'Select resource type',
  git = 'Git',
  image = 'Image',
  cluster = 'Cluster',
  storage = 'Storage',
}

type PipelineResourcesParam = {
  addLabel?: string;
  fieldName: string;
  isReadOnly?: boolean;
};

const PipelineResources: React.FC<PipelineResourcesParam> = (props) => {
  const { addLabel = 'Add Pipeline Resources', fieldName, isReadOnly = false } = props;

  return (
    <MultiColumnField
      name={fieldName}
      addLabel={addLabel}
      headers={['Name', 'Resource Type']}
      emptyValues={{ name: '', type: '' }}
      isReadOnly={isReadOnly}
    >
      <InputField
        name="name"
        type={TextInputTypes.text}
        placeholder="Name"
        isReadOnly={isReadOnly}
      />
      <DropdownField name="type" items={resourceTypes} fullWidth disabled={isReadOnly} />
    </MultiColumnField>
  );
};

export default PipelineResources;
