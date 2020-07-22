import * as React from 'react';
import { SelectGroup, SelectOption, Select, SelectVariant } from '@patternfly/react-core';
import {
  Breakdown,
  Metrics,
  ServiceType,
  Groups,
  DataConsumption,
  defaultBreakdown,
} from '../../constants';
import './data-consumption-card.scss';

type SelectItems = {
  group: string;
  items: string[];
}[];

export const getSelectOptions = (dropdownItems: SelectItems) => {
  return dropdownItems.map(({ group, items }) => (
    <SelectGroup key={group} label={group}>
      {items.map((item) => (
        <SelectOption key={item} value={item} />
      ))}
    </SelectGroup>
  ));
};

const RGWDropdown = [
  {
    group: Groups.METRIC,
    items: [Metrics.LATENCY, Metrics.BANDWIDTH],
  },
];

const ServiceTypeDropdown = [
  {
    group: Groups.SERVICE,
    items: [ServiceType.MCG, ServiceType.RGW],
  },
];

export const DataConsumptionDropdown: React.FC<DataConsumptionDropdownProps> = (props) => {
  const {
    selectedService,
    setSelectedService,
    selectedBreakdown,
    setSelectedBreakdown,
    selectedMetric,
    setSelectedMetric,
    isRgwSupported,
  } = props;
  const [isOpenComboDropdown, setComboDropdown] = React.useState(false);
  const [isOpenServiceTypeDropdown, setServiceTypeDropdown] = React.useState(false);

  const MCGDropdown = React.useMemo(
    () => [
      {
        group: Groups.BREAKDOWN,
        items: [Breakdown.PROVIDERS, Breakdown.ACCOUNTS],
      },
      {
        group: Groups.METRIC,
        items: [
          Metrics.IOPS,
          ...(selectedBreakdown === Breakdown.ACCOUNTS ? [Metrics.LOGICAL] : [Metrics.PHY_VS_LOG]),
          ...(selectedBreakdown === Breakdown.PROVIDERS ? [Metrics.EGRESS] : []),
        ],
      },
    ],
    [selectedBreakdown],
  );

  const onSelectComboDropdown = (_e: React.MouseEvent, selection: Breakdown | Metrics) => {
    const isBreakdown = (MCGDropdown[0].items as Breakdown[]).includes(selection as Breakdown);
    const breakdownBy = isBreakdown ? Groups.BREAKDOWN : Groups.METRIC;
    switch (breakdownBy) {
      case Groups.BREAKDOWN:
        setSelectedBreakdown(selection as Breakdown);
        setSelectedMetric(DataConsumption.defaultMetrics[selectedService]);
        break;
      case Groups.METRIC:
        setSelectedMetric(selection as Metrics);
        break;
      default:
        break;
    }
  };

  const onSelectServiceDropdown = (_e: React.MouseEvent, selection: ServiceType) => {
    setSelectedService(selection);
    setSelectedMetric(DataConsumption.defaultMetrics[selection]);
    if (selection === ServiceType.MCG) {
      setSelectedBreakdown(defaultBreakdown[ServiceType.MCG]);
    } else {
      setSelectedBreakdown(null);
    }
  };

  const comboDropdownItems = React.useMemo(() => {
    const dropdown = selectedService === ServiceType.MCG ? MCGDropdown : RGWDropdown;
    return getSelectOptions(dropdown);
  }, [selectedService, MCGDropdown]);

  const serviceDropdownItems = getSelectOptions(ServiceTypeDropdown);

  return (
    <div className="nb-data-consumption-card__dropdown">
      {isRgwSupported && (
        <Select
          variant={SelectVariant.single}
          className="nb-data-consumption-card__dropdown-item"
          autoFocus={false}
          onSelect={onSelectServiceDropdown}
          onToggle={() => setServiceTypeDropdown(!isOpenServiceTypeDropdown)}
          isOpen={isOpenServiceTypeDropdown}
          selections={[selectedService]}
          isGrouped
          placeholderText={`Type: ${selectedService}`}
          isCheckboxSelectionBadgeHidden
        >
          {serviceDropdownItems}
        </Select>
      )}
      <Select
        variant={SelectVariant.typeaheadMulti}
        className="nb-data-consumption-card__dropdown-item nb-data-consumption-card__dropdown-item--disable-typeahead"
        autoFocus={false}
        onSelect={onSelectComboDropdown}
        onToggle={() => setComboDropdown(!isOpenComboDropdown)}
        isOpen={isOpenComboDropdown}
        selections={[selectedBreakdown, selectedMetric]}
        isGrouped
        isCheckboxSelectionBadgeHidden
      >
        {comboDropdownItems}
      </Select>
    </div>
  );
};

type DataConsumptionDropdownProps = {
  selectedService: ServiceType;
  setSelectedService: React.Dispatch<React.SetStateAction<ServiceType>>;
  selectedBreakdown: Breakdown;
  setSelectedBreakdown: React.Dispatch<React.SetStateAction<Breakdown>>;
  selectedMetric: Metrics;
  setSelectedMetric: React.Dispatch<React.SetStateAction<Metrics>>;
  isRgwSupported: boolean;
};
