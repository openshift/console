import * as React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { availableResources, onChange, resource, taskResource } = props;

  const dropdownResources = availableResources.filter(
    ({ name, type }) => resource.type === type && !!name,
  );

  return (
    <FormGroup
      fieldId={resource.name}
      label={resource.name}
      helperText={t('pipelines-plugin~Only showing resources for this type ({{resourceType}}).', {
        resourceType: resource.type,
      })}
      helperTextInvalid={
        dropdownResources.length === 0
          ? t('pipelines-plugin~No resources available. Add pipeline resources.')
          : ''
      }
      validated={dropdownResources.length > 0 ? 'default' : 'error'}
      isRequired={!resource?.optional}
    >
      <SidebarInputWrapper>
        <Dropdown
          title={t('pipelines-plugin~Select {{resourceType}} resource...', {
            resourceType: resource.type,
          })}
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
