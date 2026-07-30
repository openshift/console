import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { PersistentVolumeClaimModel } from '../../models';
import type { PersistentVolumeClaimKind } from '../../module/k8s/types';
import { ListDropdown } from './list-dropdown';

export const PVCDropdown: FC<PVCDropdownProps> = (props) => {
  const { kind } = PersistentVolumeClaimModel;
  const { namespace, selectedKey, desc } = props;
  const resources = [{ kind, namespace }];
  const { t } = useTranslation('public');
  return (
    <ListDropdown
      {...props}
      desc={desc}
      resources={resources}
      selectedKeyKind={kind}
      placeholder={t('Select claim')}
      selectedKey={selectedKey}
    />
  );
};

export type PVCDropdownProps = {
  namespace: string;
  selectedKey: string;
  onChange: (claimName: string, kindLabel?: string, pvc?: PersistentVolumeClaimKind) => void;
  id?: string;
  desc?: string;
  dataTest?: string;
  dataFilter?: (pvc: PersistentVolumeClaimKind) => boolean;
};
