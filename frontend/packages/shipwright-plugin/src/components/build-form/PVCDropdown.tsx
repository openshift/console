import type { FC } from 'react';
import { useMemo } from 'react';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import type { PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { ResourceDropdownField } from '@console/shared';

interface PVCDropdownProps {
  name: string;
  namespace: string;
}

const PVCDropdown: FC<PVCDropdownProps> = ({ name, namespace }) => {
  const { t } = useTranslation();
  const autocompleteFilter = (strText, item): boolean => fuzzy(strText, item?.props?.name);

  const watchedResources = useK8sWatchResources<{ pvcs: PersistentVolumeClaimKind[] }>({
    pvcs: {
      isList: true,
      kind: referenceForModel(PersistentVolumeClaimModel),
      namespace,
      optional: true,
    },
  });

  const resources = useMemo(
    () => [
      {
        data: watchedResources.pvcs?.data,
        loaded: watchedResources.pvcs?.loaded,
        loadError: watchedResources.pvcs?.loadError,
        kind: PersistentVolumeClaimModel.kind,
      },
    ],
    [watchedResources.pvcs?.data, watchedResources.pvcs?.loaded, watchedResources.pvcs?.loadError],
  );

  return (
    <ResourceDropdownField
      name={name}
      resources={resources}
      dataSelector={['metadata', 'name']}
      placeholder={t('shipwright-plugin~Select a PVC')}
      autocompleteFilter={autocompleteFilter}
      fullWidth
      showBadge
    />
  );
};

export default PVCDropdown;
