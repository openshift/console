import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FirehoseResult } from '@console/internal/components/utils';
import { ResourceDropdown } from '@console/shared';
import { useExtensions } from '@console/plugin-sdk/src';
import {
  useK8sWatchResources,
  WatchK8sResources,
} from '@console/internal/components/utils/k8s-watch-hook';
import { getBaseWatchedResources } from '../topology/data-transforms';
import { isTopologyDataModelFactory, TopologyDataModelFactory } from '../../extensions/topology';

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

const applicationSelector = ['metadata', 'labels', 'app.kubernetes.io/part-of'];

const ApplicationDropdown: React.FC<ApplicationDropdownProps> = ({ namespace, ...props }) => {
  const { t } = useTranslation();
  const [resources, setResources] = React.useState<FirehoseResult[]>([]);
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState(null);
  const modelFactories = useExtensions<TopologyDataModelFactory>(isTopologyDataModelFactory);

  const watchedResources = React.useMemo(() => {
    const watchedBaseResources = getBaseWatchedResources(namespace);
    return modelFactories.reduce((acc, modelFactory) => {
      const factoryResources: WatchK8sResources<any> = modelFactory.properties.resources
        ? modelFactory.properties.resources(namespace)
        : {};
      return { ...acc, ...factoryResources };
    }, watchedBaseResources);
  }, [modelFactories, namespace]);

  const watchResults = useK8sWatchResources(watchedResources);
  React.useEffect(() => {
    if (!Object.keys(watchResults).every((key) => watchResults[key].loaded)) {
      return;
    }

    const loadErrorKey = Object.keys(watchResults).find(
      (key) => watchResults[key].loadError && !watchedResources[key].optional,
    );
    const loadedResources = Object.keys(watchResults).map((key) => ({
      ...watchResults[key],
    }));

    setLoadError(loadErrorKey ? watchResults[loadErrorKey].loadError : null);
    setLoaded(true);
    setResources(loadedResources);
  }, [watchResults, watchedResources]);

  return (
    <ResourceDropdown
      {...props}
      resources={resources}
      loaded={loaded}
      loadError={loadError}
      placeholder={t('devconsole~Select application')}
      dataSelector={applicationSelector}
    />
  );
};

export default ApplicationDropdown;
