import * as React from 'react';
import { Dropdown, DropdownToggle, DropdownItem, DropdownPosition } from '@patternfly/react-core';
import {
  ACCOUNTS,
  PROVIDERS,
  BY_IOPS,
  BY_LOGICAL_USAGE,
  BY_PHYSICAL_VS_LOGICAL_USAGE,
  BY_EGRESS,
} from '../../constants';

export const DataConsumptionDropdown: React.FC<DataConsumptionDropdownProps> = ({
  type,
  kpi,
  setType,
  setKpi,
}) => {
  const [isOpenTypeDropdown, setIsOpenTypeDropdown] = React.useState(false);
  const [isOpenKpiDropdown, setIsOpenKpiDropdown] = React.useState(false);
  const typesDropdown = {
    providers: PROVIDERS,
    accounts: ACCOUNTS,
  };

  const kpiDropdown = {
    iops: BY_IOPS,
    usage: type === typesDropdown.accounts ? BY_LOGICAL_USAGE : BY_PHYSICAL_VS_LOGICAL_USAGE,
    egress: BY_EGRESS,
  };

  const typeDropdownItems = [
    <DropdownItem id="providers" key="Providers" component="button">
      Providers
    </DropdownItem>,
    <DropdownItem id="accounts" key="Accounts" component="button">
      Accounts
    </DropdownItem>,
  ];

  const providersKpiDropdownItems = [
    <DropdownItem id="iops" key="iops" component="button">
      I/O Operations
    </DropdownItem>,
    <DropdownItem id="usage" key="phyVslog" component="button">
      Physical vs. Logical Usage
    </DropdownItem>,
    <DropdownItem id="egress" key="egress" component="button">
      Egress
    </DropdownItem>,
  ];

  const accountKpiDropdownItems = [
    <DropdownItem id="iops" key="iops" component="button">
      I/O Operations
    </DropdownItem>,
    <DropdownItem id="usage" key="phyVslog" component="button">
      Logical Used Capacity
    </DropdownItem>,
  ];

  const onToggleTypeDropdown = React.useCallback((props) => {
    setIsOpenTypeDropdown(props);
  }, []);

  const onSelectTypeDropdown = React.useCallback(
    (e) => {
      setIsOpenTypeDropdown(!isOpenTypeDropdown);
      setType(typesDropdown[e.target.id]);
      if (kpi === BY_LOGICAL_USAGE || kpi === BY_PHYSICAL_VS_LOGICAL_USAGE) {
        const val = e.target.id === 'accounts' ? BY_LOGICAL_USAGE : BY_PHYSICAL_VS_LOGICAL_USAGE;
        setKpi(val);
      }
      if (kpi === 'Egress' && e.target.id === 'accounts') {
        setKpi(kpiDropdown.iops);
      }
    },
    [isOpenTypeDropdown, typesDropdown, kpiDropdown, kpi, setKpi, setType],
  );

  const onToggleKpiDropdown = React.useCallback((props) => {
    setIsOpenKpiDropdown(props);
  }, []);

  const onSelectKpiDropdown = React.useCallback(
    (e) => {
      setIsOpenKpiDropdown(!isOpenKpiDropdown);
      setKpi(kpiDropdown[e.target.id]);
    },
    [isOpenKpiDropdown, kpiDropdown, setKpi],
  );

  return (
    <div className="nb-data-consumption-card__dropdown">
      <Dropdown
        className="nb-data-consumption-card__dropdown-item"
        autoFocus={false}
        onSelect={onSelectTypeDropdown}
        toggle={<DropdownToggle onToggle={onToggleTypeDropdown}>{type}</DropdownToggle>}
        position={DropdownPosition.right}
        isOpen={isOpenTypeDropdown}
        dropdownItems={typeDropdownItems}
      />
      <Dropdown
        className="nb-data-consumption-card__dropdown-item"
        autoFocus={false}
        onSelect={onSelectKpiDropdown}
        toggle={<DropdownToggle onToggle={onToggleKpiDropdown}>{kpi}</DropdownToggle>}
        position={DropdownPosition.right}
        isOpen={isOpenKpiDropdown}
        dropdownItems={
          type === typesDropdown.accounts ? accountKpiDropdownItems : providersKpiDropdownItems
        }
      />
    </div>
  );
};

type DataConsumptionDropdownProps = {
  type: string;
  kpi: string;
  setKpi: (value: string | ((prevVar: string) => string)) => void;
  setType: (value: string | ((prevVar: string) => string)) => void;
};
