import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectVariant,
  OptionsMenu,
  OptionsMenuPosition,
  OptionsMenuToggle,
} from '@patternfly/react-core';
import {
  getOptionsMenuItems,
  getGroupedSelectOptions,
} from '../../common/capacity-breakdown/breakdown-dropdown';
import {
  Breakdown,
  Metrics,
  ServiceType,
  Groups,
  DataConsumption,
  defaultBreakdown,
} from '../../../../constants';
import './data-consumption-card.scss';

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
  const { t } = useTranslation();
  const [isOpenComboDropdown, setComboDropdown] = React.useState(false);
  const [isOpenServiceTypeDropdown, setServiceTypeDropdown] = React.useState(false);

  const MCGDropdown = React.useMemo(
    () => [
      {
        group: t('ceph-storage-plugin~Break by'),
        items: [
          { id: Breakdown.PROVIDERS, name: t('ceph-storage-plugin~Providers') },
          { id: Breakdown.ACCOUNTS, name: t('ceph-storage-plugin~Accounts') },
        ],
      },
      {
        group: t('ceph-storage-plugin~Metric'),
        items: [
          { name: t('ceph-storage-plugin~I/O Operations'), id: Metrics.IOPS },
          ...(selectedBreakdown === Breakdown.ACCOUNTS
            ? [{ name: t('ceph-storage-plugin~Logial Used Capacity'), id: Metrics.LOGICAL }]
            : [
                {
                  name: t('ceph-storage-plugin~Physical vs. Logical used capacity'),
                  id: Metrics.PHY_VS_LOG,
                },
              ]),
          ...(selectedBreakdown === Breakdown.PROVIDERS
            ? [{ name: t('ceph-storage-plugin~Egress'), id: Metrics.EGRESS }]
            : []),
        ],
      },
    ],
    [selectedBreakdown, t],
  );

  const RGWDropdown = [
    {
      group: t('ceph-storage-plugin~Metric'),
      items: [
        { name: t('ceph-storage-plugin~Latency'), id: Metrics.LATENCY },
        { name: t('ceph-storage-plugin~Bandwidth'), id: Metrics.BANDWIDTH },
      ],
    },
  ];

  const ServiceTypeDropdown = [
    {
      group: t('ceph-storage-plugin~Service Type'),
      items: [
        { name: ServiceType.MCG, id: ServiceType.MCG },
        { name: ServiceType.RGW, id: ServiceType.RGW },
      ],
    },
  ];

  const onSelectComboDropdown = (e: React.MouseEvent) => {
    const { id } = e.currentTarget;
    const isBreakdown = id === Breakdown.ACCOUNTS || id === Breakdown.PROVIDERS;
    const breakdownBy = isBreakdown ? Groups.BREAKDOWN : Groups.METRIC;
    switch (breakdownBy) {
      case Groups.BREAKDOWN:
        setSelectedBreakdown(id as Breakdown);
        setSelectedMetric(DataConsumption.defaultMetrics[selectedService]);
        break;
      case Groups.METRIC:
        setSelectedMetric(id as Metrics);
        break;
      default:
        break;
    }
    if (selectedService !== ServiceType.MCG) {
      setComboDropdown(!isOpenComboDropdown);
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
    setServiceTypeDropdown(!isOpenServiceTypeDropdown);
  };

  const comboDropdownItems = (() => {
    const dropdown = selectedService === ServiceType.MCG ? MCGDropdown : RGWDropdown;
    return getOptionsMenuItems(
      dropdown,
      [selectedBreakdown, selectedMetric],
      onSelectComboDropdown,
    );
  })();

  const serviceDropdownItems = getGroupedSelectOptions(ServiceTypeDropdown);

  return (
    <div className="nb-data-consumption-card__dropdown">
      {isRgwSupported && (
        <Select
          variant={SelectVariant.single}
          className="nb-data-consumption-card__dropdown-item nb-data-consumption-card__dropdown-item--margin"
          autoFocus={false}
          onSelect={onSelectServiceDropdown}
          onToggle={() => setServiceTypeDropdown(!isOpenServiceTypeDropdown)}
          isOpen={isOpenServiceTypeDropdown}
          selections={[selectedService]}
          isGrouped
          placeholderText={t('ceph-storage-plugin~Type: {{selectedService}}', {
            selectedService,
          })}
          aria-label={t('ceph-storage-plugin~Break By Dropdown')}
          isCheckboxSelectionBadgeHidden
        >
          {serviceDropdownItems}
        </Select>
      )}
      <OptionsMenu
        id="breakdown-options"
        className="nb-data-consumption-card__dropdown-item nb-data-consumption-card__options-menu"
        position={OptionsMenuPosition.right}
        menuItems={comboDropdownItems}
        toggle={
          <OptionsMenuToggle
            onToggle={() => setComboDropdown(!isOpenComboDropdown)}
            toggleTemplate={
              selectedBreakdown
                ? t('ceph-storage-plugin~{{selectedMetric}} by {{selectedBreakdown}}', {
                    selectedMetric,
                    selectedBreakdown,
                  })
                : selectedMetric
            }
          />
        }
        isOpen={isOpenComboDropdown}
        isGrouped
      />
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
