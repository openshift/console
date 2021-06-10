import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Firehose } from '@console/internal/components/utils';
import { ResourceDropdown } from '@console/shared';
import { useExtensions } from '@console/plugin-sdk/src';
import { isTopologyDataModelFactory, TopologyDataModelFactory } from '../../extensions';
import { getBaseWatchedResources } from '../../data-transforms/transform-utils';

interface ApplicationDropdownProps {
  id?: string;
  ariaLabel?: string;
  className?: string;
  dropDownClassName?: string;
  menuClassName?: string;
  buttonClassName?: string;
  title?: React.ReactNode;
  titlePrefix?: string;
  allApplicationsKey?: string;
  userSettingsPrefix?: string;
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
  const { t } = useTranslation();
  const modelFactories = useExtensions<TopologyDataModelFactory>(isTopologyDataModelFactory);

  const resources = React.useMemo(() => {
    let watchedBaseResources = getBaseWatchedResources(namespace);
    modelFactories.forEach((modelFactory) => {
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
  }, [modelFactories, namespace]);

  return (
    <Firehose resources={resources}>
      <ResourceDropdown
        {...props}
        placeholder={t('topology~Select an Application')}
        dataSelector={['metadata', 'labels', 'app.kubernetes.io/part-of']}
      />
    </Firehose>
  );
};

export default ApplicationDropdown;
