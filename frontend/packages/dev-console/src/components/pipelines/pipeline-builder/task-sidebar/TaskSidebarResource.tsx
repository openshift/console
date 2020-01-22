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

  const defaultOptions = {};
  if (!taskResource?.resource) {
    defaultOptions[''] = 'Select resource...';
  }

  return (
    <FormGroup
      fieldId={resource.name}
      label={resource.name}
      helperTextInvalid={
        dropdownResources.length === 0
          ? `No resources of type ${resource.type} available. Add pipeline resources.`
          : ''
      }
      isValid={dropdownResources.length > 0}
      isRequired
    >
      <Dropdown
        // TODO: Improve Dropdown to accept a placeholder
        // HACK to allow removal of a placeholder item
        key={Object.keys(defaultOptions).length === 0 ? 'must-select' : 'has-default'}
        id={resource.name}
        items={dropdownResources.reduce(
          (acc, { name }) => ({ ...acc, [name]: name }),
          defaultOptions,
        )}
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
