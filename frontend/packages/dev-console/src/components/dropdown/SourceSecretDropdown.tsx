import type { FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { SecretModel } from '@console/internal/models';
import type { SecretKind } from '@console/internal/module/k8s';
import type { ResourceDropdownProps } from '@console/shared/src/components/dropdown/ResourceDropdown';
import { ResourceDropdown } from '@console/shared/src/components/dropdown/ResourceDropdown';

interface SourceSecretDropdownProps
  extends Omit<ResourceDropdownProps, 'resources' | 'placeholder' | 'dataSelector'> {
  namespace?: string;
}

const SourceSecretDropdown: FC<SourceSecretDropdownProps> = (props) => {
  const { t } = useTranslation();
  const filterData = (item: SecretKind) => {
    return item.type === 'kubernetes.io/basic-auth' || item.type === 'kubernetes.io/ssh-auth';
  };

  const watchSpec = useMemo(
    () => ({
      secrets: {
        isList: true,
        namespace: props.namespace,
        kind: SecretModel.kind,
        optional: true,
      },
    }),
    [props.namespace],
  );

  const watchedResources = useK8sWatchResources<{ secrets: SecretKind[] }>(watchSpec);

  const resources = useMemo(
    () => [
      {
        data: watchedResources.secrets?.data,
        loaded: watchedResources.secrets?.loaded,
        loadError: watchedResources.secrets?.loadError,
        kind: SecretModel.kind,
      },
    ],
    [
      watchedResources.secrets?.data,
      watchedResources.secrets?.loaded,
      watchedResources.secrets?.loadError,
    ],
  );

  return (
    <ResourceDropdown
      {...props}
      resources={resources}
      placeholder={t('devconsole~Select Secret name')}
      resourceFilter={filterData}
      dataSelector={['metadata', 'name']}
    />
  );
};

export default SourceSecretDropdown;
