import * as React from 'react';
import { ListDropdown } from './list-dropdown';
import { PersistentVolumeClaimModel } from '../../models';

export const PVCDropdown: React.FC<PVCDropdownProps> = (props) => {
  const kind = PersistentVolumeClaimModel.kind;
  const { namespace, selectedKey, desc } = props;
  const resources = [{ kind, namespace }];
  return (
    <ListDropdown
      {...props}
      desc={desc}
      resources={resources}
      selectedKeyKind={kind}
      placeholder="Select claim"
      selectedKey={selectedKey}
    />
  );
};

export type PVCDropdownProps = {
  namespace: string;
  selectedKey: string;
  onChange: (string) => void;
  id: string;
  desc?: string;
};
