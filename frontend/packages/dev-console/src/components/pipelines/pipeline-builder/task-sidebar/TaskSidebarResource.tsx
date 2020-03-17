import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import { DropdownField } from '@console/shared';
import { PipelineResource, PipelineResourceTaskResource } from '../../../../utils/pipeline-augment';
import { SidebarInputWrapper } from './field-utils';

type TaskSidebarResourceProps = {
  availableResources: PipelineResource[];
  name: string;
  resource: PipelineResourceTaskResource;
};

const TaskSidebarResource: React.FC<TaskSidebarResourceProps> = (props) => {
  const { availableResources, name, resource } = props;
  const { setFieldValue } = useFormikContext<FormikValues>();

  const dropdownResources = availableResources.filter(
    ({ name: resourceName, type }) => resource.type === type && !!resourceName,
  );

  return (
    <SidebarInputWrapper>
      <DropdownField
        label={resource.name}
        fullWidth
        disabled={dropdownResources.length === 0}
        title={`Select ${resource.type} resource...`}
        items={dropdownResources.reduce(
          (acc, { name: resourceName }) => ({ ...acc, [resourceName]: resourceName }),
          {},
        )}
        required
        name={`${name}.resource`}
        helpText={
          dropdownResources.length === 0
            ? 'No resources available. Add pipeline resources.'
            : `Only showing ${resource.type} resources.`
        }
        onChange={(resourceName: string) => {
          setFieldValue(name, { name: resource.name, resource: resourceName });
        }}
      />
    </SidebarInputWrapper>
  );
};

export default TaskSidebarResource;
