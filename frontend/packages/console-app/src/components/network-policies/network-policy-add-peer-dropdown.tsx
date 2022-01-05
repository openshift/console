import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from '@console/internal/components/utils';

export type NetworkPolicyPeerType = 'sameNS' | 'anyNS' | 'ipBlock';

export const NetworkPolicyAddPeerDropdown: React.FunctionComponent<NetworkPolicyAddPeerDropdownProps> = (
  props,
) => {
  const { t } = useTranslation();
  const { title, onSelect } = props;
  const options = [
    t('console-app~Allow pods from the same namespace'),
    t('console-app~Allow pods from inside the cluster'),
    t('console-app~Allow peers by IP block'),
  ];
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
        buttonClassName="pf-c-button pf-m-secondary"
        data-test="add-peer"
      />
    </div>
  );
};

type NetworkPolicyAddPeerDropdownProps = {
  title: string;
  onSelect: (type: NetworkPolicyPeerType) => void;
};
