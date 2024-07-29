import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { ResourceDropdownField } from '@console/shared';

interface PVCDropdownProps {
  name: string;
  namespace: string;
}

const PVCDropdown: React.FC<PVCDropdownProps> = ({ name, namespace }) => {
  const { t } = useTranslation();
  const autocompleteFilter = (strText, item): boolean => fuzzy(strText, item?.props?.name);
  const resources = [
    {
      isList: true,
      kind: PersistentVolumeClaimModel.kind,
      namespace,
      prop: PersistentVolumeClaimModel.id,
      optional: true,
    },
  ];
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
