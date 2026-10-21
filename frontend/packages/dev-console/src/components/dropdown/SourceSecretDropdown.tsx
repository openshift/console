import type { FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
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

  const [secrets, secretsLoaded, secretsLoadError] = useK8sWatchResource<SecretKind[]>({
    isList: true,
    namespace: props.namespace,
    kind: SecretModel.kind,
    optional: true,
  });

  const resources = useMemo(
    () => [
      {
        data: secrets,
        loaded: secretsLoaded,
        loadError: secretsLoadError,
        kind: SecretModel.kind,
      },
    ],
    [secrets, secretsLoaded, secretsLoadError],
  );

  return (
    <ResourceDropdown
      {...props}
      resources={resources}
      loaded={secretsLoaded}
      loadError={secretsLoadError}
      placeholder={t('devconsole~Select Secret name')}
      resourceFilter={filterData}
      dataSelector={['metadata', 'name']}
    />
  );
};

export default SourceSecretDropdown;
