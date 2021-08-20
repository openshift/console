import * as React from 'react';
import { Select, SelectOption, SelectVariant, Skeleton } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { UserPreferenceDropdownField as DropdownFieldType } from '@console/dynamic-plugin-sdk/src';
import { useUserSettings } from '@console/shared';
import { UserPreferenceFieldProps } from './types';

type UserPreferenceDropdownFieldProps = UserPreferenceFieldProps<DropdownFieldType>;

const UserPreferenceDropdownField: React.FC<UserPreferenceDropdownFieldProps> = ({
  id,
  userSettingsKey,
  defaultValue,
  options,
}) => {
  // resources and calls to hooks
  const { t } = useTranslation();
  const [
    currentUserPreferenceValue,
    setCurrentUserPreferenceValue,
    currentUserPreferenceValueLoaded,
  ] = useUserSettings<string>(userSettingsKey);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const selectOptions: JSX.Element[] = React.useMemo(
    () =>
      options.map((dropdownOption, index) => {
        const key = `${dropdownOption.label}${index}`;
        return <SelectOption key={key} value={dropdownOption.label} />;
      }),
    [options],
  );
  const loaded: boolean = currentUserPreferenceValueLoaded;

  if (defaultValue && loaded && !currentUserPreferenceValue) {
    setCurrentUserPreferenceValue(defaultValue);
  }

  // utils and callbacks
  const getDropdownValueFromLabel = (searchLabel: string): string =>
    options.find((option) => option.label === searchLabel)?.value;
  const getDropdownLabelFromValue = (searchValue: string): string =>
    options.find((option) => option.value === searchValue)?.label;
  const onToggle = (isOpen: boolean) => setDropdownOpen(isOpen);
  const onSelect = (_, selection) => {
    const selectedValue = getDropdownValueFromLabel(selection);
    selectedValue !== currentUserPreferenceValue && setCurrentUserPreferenceValue(selectedValue);
    setDropdownOpen(false);
  };

  return loaded ? (
    <Select
      toggleId={id}
      variant={SelectVariant.single}
      isOpen={dropdownOpen}
      selections={getDropdownLabelFromValue(currentUserPreferenceValue)}
      onToggle={onToggle}
      onSelect={onSelect}
      placeholderText={t('console-app~Select an option')}
      data-test={`dropdown ${id}`}
    >
      {selectOptions}
    </Select>
  ) : (
    <Skeleton height="30px" width="100%" data-test={`dropdown skeleton ${id}`} />
  );
};
export default UserPreferenceDropdownField;
