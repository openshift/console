import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  isTopologyDataModelFactory as isDynamicTopologyDataModelFactory,
  TopologyDataModelFactory as DynamicTopologyDataModelFactory,
} from '@console/dynamic-plugin-sdk';
import { Firehose } from '@console/internal/components/utils';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import { ResourceDropdown } from '@console/shared';
import { ResourceDropdownProps } from '../../../../console-shared/src/components/dropdown/ResourceDropdown';
import { getNamespacedDynamicModelFactories } from '../../data-transforms/DataModelProvider';
import { getBaseWatchedResources } from '../../data-transforms/transform-utils';
import { isTopologyDataModelFactory, TopologyDataModelFactory } from '../../extensions';

type ApplicationDropdownProps = Omit<ResourceDropdownProps, 'dataSelector' | 'placeholder'> & {
  namespace?: string;
};

const ApplicationDropdown: React.FC<ApplicationDropdownProps> = ({ namespace, ...props }) => {
  const { t } = useTranslation();
  const modelFactories = useExtensions<TopologyDataModelFactory>(isTopologyDataModelFactory);
  const dynamicModelFactories = useExtensions<DynamicTopologyDataModelFactory>(
    isDynamicTopologyDataModelFactory,
  );

  const namespacedDynamicFactories = React.useMemo(
    () => getNamespacedDynamicModelFactories(dynamicModelFactories),
    [dynamicModelFactories],
  );

  const resources = React.useMemo(() => {
    let watchedBaseResources = getBaseWatchedResources(namespace);
    [...modelFactories, ...namespacedDynamicFactories].forEach((modelFactory) => {
      const factoryResources = modelFactory.properties.resources?.(namespace);
      if (factoryResources) {
        watchedBaseResources = {
          ...factoryResources,
          ...watchedBaseResources,
        };
      }
    });
    return Object.keys(watchedBaseResources).map((key) => ({
      ...watchedBaseResources[key],
      prop: key,
    }));
  }, [namespacedDynamicFactories, modelFactories, namespace]);

  return (
    <Firehose resources={resources}>
      <ResourceDropdown
        {...props}
        placeholder={t('topology~Select an application')}
        dataSelector={['metadata', 'labels', 'app.kubernetes.io/part-of']}
      />
    </Firehose>
  );
};

export default ApplicationDropdown;
