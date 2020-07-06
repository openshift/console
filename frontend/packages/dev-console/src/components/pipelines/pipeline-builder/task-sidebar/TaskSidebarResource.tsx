import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { Dropdown } from '@console/internal/components/utils';
import {
  PipelineResource,
  PipelineResourceTaskResource,
  PipelineTaskResource,
} from '../../../../utils/pipeline-augment';
import { SidebarInputWrapper } from './temp-utils';

type TaskSidebarResourceProps = {
  availableResources: PipelineResource[];
  onChange: (resourceName: string, resource: PipelineResource) => void;
  resource: PipelineResourceTaskResource;
  taskResource?: PipelineTaskResource;
};

const TaskSidebarResource: React.FC<TaskSidebarResourceProps> = (props) => {
  const { availableResources, onChange, resource, taskResource } = props;

  const dropdownResources = availableResources.filter(
    ({ name, type }) => resource.type === type && !!name,
  );

  return (
    <FormGroup
      fieldId={resource.name}
      label={resource.name}
      helperText={`Only showing resources for this type (${resource.type}).`}
      helperTextInvalid={
        dropdownResources.length === 0 ? `No resources available. Add pipeline resources.` : ''
      }
      validated={dropdownResources.length > 0 ? 'default' : 'error'}
      isRequired
    >
      <SidebarInputWrapper>
        <Dropdown
          title={`Select ${resource.type} resource...`}
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
      </SidebarInputWrapper>
    </FormGroup>
  );
};

export default TaskSidebarResource;
