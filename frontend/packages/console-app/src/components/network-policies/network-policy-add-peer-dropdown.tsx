import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from '@console/internal/components/utils';

export type NetworkPolicyPeerType = 'sameNS' | 'anyNS' | 'ipBlock';

export const NetworkPolicyAddPeerDropdown: React.FunctionComponent<NetworkPolicyAddPeerDropdownProps> = (
  props,
) => {
  const { t } = useTranslation();
  const { title, onSelect } = props;
  return (
    <div className="form-group co-create-networkpolicy__add-peer">
      <Dropdown
        dropDownClassName="dropdown--full-width"
        items={{
          sameNS: <>{options[0]}</>,
          anyNS: <>{options[1]}</>,
          ipblock: <>{options[2]}</>,
        }}
        title={title}
        onChange={onSelect}
        noSelection
        buttonClassName="pf-v6-c-button pf-m-secondary"
        data-test="add-peer"
      />
    </div>
  );
};

type NetworkPolicyAddPeerDropdownProps = {
  title: string;
  onSelect: (type: NetworkPolicyPeerType) => void;
};
