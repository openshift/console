import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import { getIcon, getIcons } from '@console/internal/components/catalog/catalog-item-icon';
import { Dropdown } from '@console/internal/components/utils/dropdown';

import './IconDropdown.scss';

export type IconDropdownProps = {
  placeholder: string;
  value: string;
  onChanged: (value: string) => void;
};

type IconProps = {
  label: string;
  url: string;
};

const Icon: React.FC<IconProps> = ({ label, url }) => (
  <>
    <img src={url} width="24" height="24" alt={label} className="icon" />
    {label}
  </>
);

const iconLabelAutocompleteFilter = (text: string, item: React.ReactElement<IconProps>) =>
  fuzzy(text, item.props.label);

const IconDropdown: React.FC<IconDropdownProps> = ({ placeholder, value, onChanged }) => {
  const title = React.useMemo<React.ReactElement>(() => {
    const icon = getIcon(value || 'openshift');
    return icon ? (
      <Icon label={icon.label} url={icon.url} />
    ) : (
      <span className="btn-dropdown__item--placeholder">{placeholder}</span>
    );
  }, [placeholder, value]);

  const items = React.useMemo<Record<string, React.ReactElement>>(() => {
    const options: Record<string, React.ReactElement> = {};
    getIcons().forEach(({ label, url }) => {
      options[label] = <Icon label={label} url={url} />;
    });
    return options;
  }, []);

  return (
    <Dropdown
      title={title}
      items={items}
      autoSelect
      autocompletePlaceholder={placeholder}
      autocompleteFilter={iconLabelAutocompleteFilter}
      dropDownClassName="dropdown--full-width odc-icon-dropdown"
      menuClassName="odc-icon-dropdown__menu"
      onChange={onChanged}
    />
  );
};

export default IconDropdown;
