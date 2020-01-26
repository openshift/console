import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { Dropdown } from '@console/internal/components/utils';
import {
  PipelineResource,
  PipelineResourceTaskResource,
  PipelineTaskResource,
} from '../../../../utils/pipeline-augment';

type TaskSidebarResourceProps = {
  availableResources: PipelineResource[];
  onChange: (resourceName: string, resource: PipelineResource) => void;
  resource: PipelineResourceTaskResource;
  taskResource?: PipelineTaskResource;
};

const TaskSidebarResource: React.FC<TaskSidebarResourceProps> = (props) => {
  const { availableResources, onChange, resource, taskResource } = props;

  const dropdownResources = availableResources.filter(({ type }) => resource.type === type);

  return (
    <FormGroup
      fieldId={resource.name}
      label={resource.name}
      helperText={`Only showing resources for this type (${resource.type}).`}
      helperTextInvalid={
        dropdownResources.length === 0
          ? `No resources of type ${resource.type} available. Add pipeline resources.`
          : ''
      }
      isValid={dropdownResources.length > 0}
      isRequired
    >
      <Dropdown
        title="Select resource..."
        items={dropdownResources.reduce((acc, { name }) => ({ ...acc, [name]: name }), {})}
        disabled={dropdownResources.length === 0}
        selectedKey={taskResource?.resource || ''}
        dropDownClassName="dropdown--full-width"
        onChange={(value: string) => {
          onChange(
            resource.name,
            dropdownResources.find(({ name }) => name === value),
          );
        }}
      />
    </FormGroup>
  );
};

export default TaskSidebarResource;
