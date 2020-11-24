import * as React from 'react';
import { Firehose } from '@console/internal/components/utils';
import { WatchK8sResources } from '@console/internal/components/utils/k8s-watch-hook';
import { ResourceDropdown } from '@console/shared';
import { useExtensions } from '@console/plugin-sdk/src';
import { isTopologyDataModelFactory, TopologyDataModelFactory } from '../../extensions';
import { getBaseWatchedResources } from '../../data-transforms/transform-utils';

interface ApplicationDropdownProps {
  id?: string;
  className?: string;
  dropDownClassName?: string;
  menuClassName?: string;
  buttonClassName?: string;
  title?: React.ReactNode;
  titlePrefix?: string;
  allApplicationsKey?: string;
  storageKey?: string;
  disabled?: boolean;
  allSelectorItem?: {
    allSelectorKey?: string;
    allSelectorTitle?: string;
  };
  noneSelectorItem?: {
    noneSelectorKey?: string;
    noneSelectorTitle?: string;
  };
  namespace?: string;
  actionItems?: {
    actionTitle: string;
    actionKey: string;
  }[];
  selectedKey: string;
  autoSelect?: boolean;
  onChange?: (key: string, name?: string) => void;
  onLoad?: (items: { [key: string]: string }) => void;
}

const ApplicationDropdown: React.FC<ApplicationDropdownProps> = ({ namespace, ...props }) => {
  const modelFactories = useExtensions<TopologyDataModelFactory>(isTopologyDataModelFactory);

  const resources = React.useMemo(() => {
    const watchedBaseResources = getBaseWatchedResources(namespace);
    const baseResources = Object.keys(watchedBaseResources).map((key) => ({
      ...watchedBaseResources[key],
      prop: key,
    }));
    return modelFactories.reduce((acc, modelFactory) => {
      const factoryResources: WatchK8sResources<any> = modelFactory.properties.resources
        ? modelFactory.properties.resources(namespace)
        : {};
      Object.keys(factoryResources).forEach((key) => {
        acc.push({
          ...factoryResources[key],
          prop: key,
        });
      });
      return acc;
    }, baseResources);
  }, [modelFactories, namespace]);

  return (
    <Firehose resources={resources}>
      <ResourceDropdown
        {...props}
        placeholder="Select an Application"
        dataSelector={['metadata', 'labels', 'app.kubernetes.io/part-of']}
      />
    </Firehose>
  );
};

export default ApplicationDropdown;
