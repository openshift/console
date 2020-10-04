import * as React from 'react';
import { Dropdown } from '@console/internal/components/utils';
import { OCS_DEVICE_SET_REPLICA } from '../constants';

export const OSD_CAPACITY_SIZES = {
  '512Gi': {
    scale: 'SmallScale',
    size: 0.5,
    title: '0.5 TiB',
  },
  '2Ti': {
    scale: 'Standard',
    size: 2,
    title: '2 TiB',
  },
  '4Ti': {
    scale: 'LargeScale',
    size: 4,
    title: '4 TiB',
  },
};

export const TotalCapacityText: React.FC<TotalCapacityTextProps> = ({ capacity }) => (
  <span>
    x {OCS_DEVICE_SET_REPLICA} replicas = {OSD_CAPACITY_SIZES[capacity].size * 3} TiB
  </span>
);

type TotalCapacityTextProps = { capacity: string };

const DropdownOptionsItem: React.FC<DropdownOptionsItemProps> = ({ title, scale }) => (
  <span className="co-resource-item">
    <span className="co-resource-item__resource-name">
      {title}
      <>
        &nbsp;
        <div className="co-resource-item__resource-api text-muted co-truncate show co-nowrap small">
          {scale}
        </div>
      </>
    </span>
  </span>
);

type DropdownOptionsItemProps = { title: string; scale: string };

export const OSDSizeDropdown: React.FC<OSDSizeDropdownProps> = ({ selectedKey, id, onChange }) => {
  const dropdownOptionsKeys: string[] = Object.keys(OSD_CAPACITY_SIZES);
  const dropdownOptions: DropdownOptions = dropdownOptionsKeys.reduce((dropdownObject, key) => {
    dropdownObject[key] = (
      <DropdownOptionsItem
        title={OSD_CAPACITY_SIZES[key].title}
        scale={OSD_CAPACITY_SIZES[key].scale}
      />
    );
    return dropdownObject;
  }, {});
  return (
    <Dropdown
      id={id}
      items={dropdownOptions}
      title={OSD_CAPACITY_SIZES[selectedKey].title}
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
