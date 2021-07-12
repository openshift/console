import * as React from 'react';
import { Select, SelectOption, SelectVariant, Skeleton } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useUserSettings } from '@console/shared';
import { DropdownOption } from './types';

type UserPreferenceInputDropdownProps = {
  id: string;
  label: string;
  userSettingKey: string;
  dropdownOptions: DropdownOption[];
};

const UserPreferenceInputDropdown: React.FC<UserPreferenceInputDropdownProps> = ({
  id,
  userSettingKey,
  dropdownOptions,
  label,
}) => {
  // resources and calls to hooks
  const { t } = useTranslation();
  const [
    currentUserSettingValue,
    setCurrentUserSettingValue,
    currentUserSettingValueLoaded,
  ] = useUserSettings<string>(userSettingKey);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const selectOptions: JSX.Element[] = React.useMemo(
    () =>
      dropdownOptions.map((dropdownOption, index) => {
        const key = `${dropdownOption.label}${index}`;
        return <SelectOption key={key} value={dropdownOption.label} />;
      }),
    [dropdownOptions],
  );
  const loaded: boolean = currentUserSettingValueLoaded;

  // utils and callbacks
  const getDropdownValueFromLabel = (searchLabel: string): string =>
    dropdownOptions.find((option) => option.label === searchLabel)?.value;
  const getDropdownLabelFromValue = (searchValue: string): string =>
    dropdownOptions.find((option) => option.value === searchValue)?.label;
  const onToggle = (isOpen: boolean) => setDropdownOpen(isOpen);
  const onSelect = (_, selection) => {
    const selectedValue = getDropdownValueFromLabel(selection);
    selectedValue !== currentUserSettingValue && setCurrentUserSettingValue(selectedValue);
    setDropdownOpen(false);
  };

  return loaded ? (
    <Select
      variant={SelectVariant.single}
      isOpen={dropdownOpen}
      selections={getDropdownLabelFromValue(currentUserSettingValue)}
      onToggle={onToggle}
      onSelect={onSelect}
      typeAheadAriaLabel={t('console-app~Select a value for {{label}}', { label })}
      placeholderText={t('console-app~Select a value for {{label}}', { label })}
      data-test={`dropdown ${id}`}
    >
      {selectOptions}
    </Select>
  ) : (
    <Skeleton height="30px" width="256px" data-test={`dropdown skeleton ${id}`} />
  );
};
export default UserPreferenceInputDropdown;
