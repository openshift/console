import * as React from 'react';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { DropdownField } from '@console/shared';
import { TektonResource } from '../../../../types';
import { PipelineBuilderFormikValues } from '../types';

type TaskSidebarResourceProps = {
  availableResources: TektonResource[];
  hasResource: boolean;
  name: string;
  resource: TektonResource;
};

const TaskSidebarResource: React.FC<TaskSidebarResourceProps> = (props) => {
  const { t } = useTranslation();
  const { setFieldValue } = useFormikContext<PipelineBuilderFormikValues>();
  const {
    availableResources,
    hasResource,
    name,
    resource: { name: resourceName, type: resourceType },
  } = props;

  const dropdownResources = availableResources.filter(
    (resource) => resourceType === resource.type && !!resource.name,
  );

  return (
    <DropdownField
      name={`${name}.resource`}
      label={resourceName}
      title={t('pipelines-plugin~Select {{resourceType}} resource...', { resourceType })}
      helpText={t('pipelines-plugin~Only showing resources for this type ({{resourceType}}).', {
        resourceType,
      })}
      disabled={dropdownResources.length === 0}
      items={dropdownResources.reduce(
        (acc, resource) => ({ ...acc, [resource.name]: resource.name }),
        {},
      )}
      onChange={(selectedResource: string) => {
        if (!hasResource) {
          setFieldValue(name, { name: resourceName, resource: selectedResource });
        }
      }}
      fullWidth
      required
    />
  );
};

export default TaskSidebarResource;
