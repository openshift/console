import type { FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { ResourceDropdown } from '@console/shared';
import type { ResourceDropdownProps } from '../../../../console-shared/src/components/dropdown/ResourceDropdown';
import { getBaseWatchedResources } from '../../data-transforms/transform-utils';

type ApplicationDropdownProps = Omit<ResourceDropdownProps, 'dataSelector' | 'placeholder'> & {
  namespace?: string;
};

const ApplicationDropdown: FC<ApplicationDropdownProps> = ({ namespace, ...props }) => {
  const { t } = useTranslation();

  const watchedBaseResources = useMemo(() => getBaseWatchedResources(namespace), [namespace]);

  const watchedResources = useK8sWatchResources(watchedBaseResources);

  // Convert useK8sWatchResources object format to array format expected by ResourceDropdown
  // TODO: Reconsider this logic after Refactor ResourceDropdown work
  const { resources, loaded, loadError } = useMemo(() => {
    const resourcesArray = Object.entries(watchedResources).map(([key, value]) => ({
      ...value,
      kind: watchedBaseResources[key]?.kind,
    }));

    const allLoaded = resourcesArray.every((r) => r.loaded || r.loadError);

    return {
      resources: resourcesArray,
      loaded: allLoaded,
      loadError: undefined,
    };
  }, [watchedResources, watchedBaseResources]);

  return (
    <ResourceDropdown
      {...props}
      resources={resources}
      loaded={loaded}
      loadError={loadError}
      placeholder={t('topology~Select an application')}
      dataSelector={['metadata', 'labels', 'app.kubernetes.io/part-of']}
    />
  );
};

export default ApplicationDropdown;
