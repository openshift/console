import type { FC } from 'react';
import { useMemo } from 'react';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { SecretModel } from '@console/internal/models';
import type { SecretKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { ResourceDropdownField } from '@console/shared';

interface SecretDropdownProps {
  name: string;
  namespace: string;
}

const SecretDropdown: FC<SecretDropdownProps> = ({ name, namespace }) => {
  const { t } = useTranslation();
  const autocompleteFilter = (strText, item): boolean => fuzzy(strText, item?.props?.name);

  const watchedResources = useK8sWatchResources<{ secrets: SecretKind[] }>({
    secrets: {
      isList: true,
      kind: referenceForModel(SecretModel),
      namespace,
      optional: true,
    },
  });

  const resources = useMemo(
    () => [
      {
        data: watchedResources.secrets.data,
        loaded: watchedResources.secrets.loaded,
        loadError: watchedResources.secrets.loadError,
        kind: SecretModel.kind,
      },
    ],
    [
      watchedResources.secrets.data,
      watchedResources.secrets.loaded,
      watchedResources.secrets.loadError,
    ],
  );

  return (
    <ResourceDropdownField
      name={name}
      resources={resources}
      dataSelector={['metadata', 'name']}
      placeholder={t('shipwright-plugin~Select a Secret')}
      autocompleteFilter={autocompleteFilter}
      fullWidth
      showBadge
    />
  );
};

export default SecretDropdown;
