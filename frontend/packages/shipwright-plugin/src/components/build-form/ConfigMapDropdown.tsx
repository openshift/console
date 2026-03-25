import type { FC } from 'react';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/lib-core';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { ConfigMapModel } from '@console/internal/models';
import type { ConfigMapKind } from '@console/internal/module/k8s';
import type { ResourceDropdownProps } from '@console/shared/src/components/dropdown/ResourceDropdown';
import { ResourceDropdown } from '@console/shared/src/components/dropdown/ResourceDropdown';

type ConfigMapDropdownProps = Omit<
  ResourceDropdownProps,
  | 'dataSelector'
  | 'placeholder'
  | 'autocompleteFilter'
  | 'showBadge'
  | 'resources'
  | 'loadError'
  | 'loaded'
> & {
  namespace?: string;
  name: string;
};

const ConfigMapDropdown: FC<ConfigMapDropdownProps> = (props) => {
  const { t } = useTranslation();
  const autocompleteFilter = (strText, item): boolean => fuzzy(strText, item?.props?.name);
  const resources = {
    configmap: {
      isList: true,
      namespace: props.namespace,
      groupVersionKind: getGroupVersionKindForModel(ConfigMapModel),
    },
  };
  const watchedResources = useK8sWatchResources<{ configmap: ConfigMapKind[] }>(resources);

  return (
    <ResourceDropdown
      {...props}
      dataSelector={['metadata', 'name']}
      placeholder={t('shipwright-plugin~Select a ConfigMap')}
      autocompleteFilter={autocompleteFilter}
      showBadge
      resources={[
        {
          data: watchedResources.configmap.data,
          loaded: watchedResources.configmap.loaded,
          loadError: watchedResources.configmap.loadError,
          kind: ConfigMapModel.kind,
        },
      ]}
      loadError={watchedResources.configmap.loadError}
      loaded={watchedResources.configmap.loaded}
    />
  );
};

export default ConfigMapDropdown;
