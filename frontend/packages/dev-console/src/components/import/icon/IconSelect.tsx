import * as React from 'react';
import { Select, SelectOption, SelectVariant } from '@patternfly/react-core';
import {
  getIconNames,
  getImageForIconClass,
  normalizeIconClass,
} from '@console/internal/components/catalog/catalog-item-icon';

export type IconSelectProps = {
  // icons: { key: string; name: string }[];
  value: string;
  onValueSelected: (value: string) => void;
  onClear: () => void;
};

const IconSelect: React.FC<IconSelectProps> = ({ value, onValueSelected, onClear }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Automatically focus and select the input element when the Select was opened.
  // TODO: This workaround is required because the PatternFly Select variant typeahead do not show the placeholder with image.
  const selectRef = React.useRef<any>();
  React.useEffect(() => {
    const selectElement: HTMLDivElement = selectRef.current?.parentRef.current;
    const inputElement: HTMLInputElement = selectElement?.querySelector('input');
    if (isOpen && inputElement) {
      inputElement.select();
    }
  }, [isOpen]);

  const iconNames = React.useMemo<string[]>(
    () => getIconNames().map((iconName) => iconName.replace(/^icon-/, '')),
    [],
  );
  const selectOptions = React.useMemo<React.ReactElement[]>(() => {
    const options: React.ReactElement[] = [];

    if (value && !iconNames.includes(value)) {
      options.push(
        <SelectOption key="custom" value={value}>
          <img src={value} width="20" height="20" alt="Your custom icon" className="custom-icon" />
          {value}
        </SelectOption>,
      );
    }

    iconNames.forEach((iconName) => {
      const imageURL = getImageForIconClass(`icon-${iconName}`);
      if (imageURL) {
        options.push(
          <SelectOption key={iconName} value={iconName}>
            <img src={imageURL} width="24" height="24" alt={iconName} className="icon" />
            {iconName}
          </SelectOption>,
        );
      } else {
        options.push(
          <SelectOption key={iconName} value={iconName}>
            <span className={normalizeIconClass(`icon-${iconName}`)} />
            {iconName}
          </SelectOption>,
        );
      }
    });

    return options;
  }, [iconNames, value]);

  const onToggle = () => setIsOpen(!isOpen);
  const onSelect = (_, selection: string) => {
    onValueSelected(selection);
    setIsOpen(false);
  };
  /*
  const onClear = () => {
    onValueSelected(null);
  };
  */
  const onCreateOption = (newOptionValue: string) => {
    onValueSelected(newOptionValue);
  };

  return (
    <Select
      ref={selectRef}
      variant={isOpen ? SelectVariant.typeahead : SelectVariant.single}
      placeholderText="Select Icon or enter an URL"
      typeAheadAriaLabel="Select Icon or enter an URL"
      maxHeight={300}
      isOpen={isOpen}
      isCreatable
      selections={value}
      onToggle={onToggle}
      onSelect={onSelect}
      onClear={onClear}
      onCreateOption={onCreateOption}
    >
      {selectOptions}
    </Select>
  );
};

// isPlaceholder={option.key === 0}

export default IconSelect;
