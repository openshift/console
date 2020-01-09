import * as React from 'react';
import { Dropdown } from '@console/internal/components/utils';

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

export const OSDSizeDropdown: React.FC<OSDSizeDropdownProps> = ({
  selectedKey,
  onChange,
  className,
}) => {
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
      id="ocs-service-capacity-dropdown"
      items={dropdownOptions}
      title={OSD_CAPACITY_SIZES[selectedKey].title}
      onChange={onChange}
      selectedKey={selectedKey}
      noSelection
      buttonClassName={className}
    />
  );
};

type DropdownOptions = { [key: string]: React.ReactNode };

type OSDSizeDropdownProps = {
  className: string;
  selectedKey: string;
  onChange: React.Dispatch<React.SetStateAction<string>>;
};
