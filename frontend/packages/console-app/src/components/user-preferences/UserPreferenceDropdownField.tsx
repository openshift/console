import * as React from 'react';
import { Select, SelectOption, SelectVariant, Skeleton } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { UserPreferenceDropdownField as DropdownFieldType } from '@console/dynamic-plugin-sdk/src';
import { useTelemetry, useUserSettings } from '@console/shared';
import { UserPreferenceFieldProps } from './types';

import './UserPreferenceField.scss';

type UserPreferenceDropdownFieldProps = UserPreferenceFieldProps<DropdownFieldType>;

const UserPreferenceDropdownField: React.FC<UserPreferenceDropdownFieldProps> = ({
  id,
  userSettingsKey,
  defaultValue,
  options,
  description,
}) => {
  // resources and calls to hooks
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();
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
        return (
          <SelectOption
            key={key}
            value={dropdownOption.label}
            description={dropdownOption?.description}
          />
        );
      }),
    [options],
  );
  const loaded: boolean = currentUserPreferenceValueLoaded;

  const isCurrentUserPreferenceValuePresentInOptions = options.find(
    (option) => option.value === currentUserPreferenceValue,
  );

  if (
    (defaultValue && loaded && !currentUserPreferenceValue) ||
    (defaultValue && loaded && !isCurrentUserPreferenceValuePresentInOptions)
  ) {
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
    fireTelemetryEvent('User Preference Changed', {
      property: userSettingsKey,
      value: selectedValue,
    });
  };

  return loaded ? (
    <>
      {description && (
        <div className="co-help-text co-user-preference-field--description">{description}</div>
      )}
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
    </>
  ) : (
    <Skeleton height="30px" width="100%" data-test={`dropdown skeleton ${id}`} />
  );
};
export default UserPreferenceDropdownField;
