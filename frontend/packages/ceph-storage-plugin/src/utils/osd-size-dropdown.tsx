import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from '@console/internal/components/utils';
import { OCS_DEVICE_SET_REPLICA } from '../constants';

export const OSD_CAPACITY_SIZES = {
  '512Gi': 0.5,
  '2Ti': 2,
  '4Ti': 4,
};

export const TotalCapacityText: React.FC<TotalCapacityTextProps> = ({ capacity }) => {
  const { t } = useTranslation();

  return (
    <span>
      {t('ceph-storage-plugin~x {{replica}} replicas = {{osdSize, number}} TiB', {
        replica: OCS_DEVICE_SET_REPLICA,
        osdSize: OSD_CAPACITY_SIZES[capacity] * 3,
      })}
    </span>
  );
};

type TotalCapacityTextProps = { capacity: string };

const DropdownOptionsItem: React.FC<DropdownOptionsItemProps> = ({ title, scale }) => (
  <span className="co-resource-item">
    <span className="co-resource-item__resource-name">
      {title}
      <>
        &nbsp;
        <div className="co-resource-item__resource-api text-muted co-truncate pf-u-display-block co-nowrap small">
          {scale}
        </div>
      </>
    </span>
  </span>
);

type DropdownOptionsItemProps = { title: string; scale: string };

export const OSDSizeDropdown: React.FC<OSDSizeDropdownProps> = ({ selectedKey, id, onChange }) => {
  const { t } = useTranslation();

  const dropdownOptions: DropdownOptions = {
    '512Gi': (
      <DropdownOptionsItem
        scale={t('ceph-storage-plugin~SmallScale')}
        title={t('ceph-storage-plugin~0.5 TiB')}
      />
    ),
    '2Ti': (
      <DropdownOptionsItem
        scale={t('ceph-storage-plugin~Standard')}
        title={t('ceph-storage-plugin~2 TiB')}
      />
    ),
    '4Ti': (
      <DropdownOptionsItem
        scale={t('ceph-storage-plugin~LargeScale')}
        title={t('ceph-storage-plugin~4 TiB')}
      />
    ),
  };

  return (
    <Dropdown
      id={id}
      items={dropdownOptions}
      title={t('ceph-storage-plugin~{{osdSize, number}} TiB', {
        osdSize: OSD_CAPACITY_SIZES[selectedKey],
      })}
      onChange={onChange}
      selectedKey={selectedKey}
      dropDownClassName="dropdown--full-width"
      noSelection
    />
  );
};

type DropdownOptions = { [key: string]: React.ReactNode };

type OSDSizeDropdownProps = {
  selectedKey: string;
  id?: string;
  onChange: React.Dispatch<React.SetStateAction<string>>;
};
