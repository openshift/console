import * as React from 'react';
import { MultiColumnField, InputField, DropdownField } from '../formik-fields';
import { GitTypes } from '../import/import-types';

const PipelineResources = (props) => {
  return (
    <MultiColumnField
      name="resources"
      addLabel="Add Pipeline Resources"
      headers={['Name', 'GitTypes']}
      emptyValues={{ name: '', default: '' }}
    >
      <InputField label="name" name="name" type="text" placeholder="Name" />
      <DropdownField name="default" items={GitTypes} fullWidth />
    </MultiColumnField>
  );
};

export default PipelineResources;
