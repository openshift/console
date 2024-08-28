import * as React from 'react';
import {
  MenuToggle,
  MenuToggleElement,
  Skeleton,
  Select,
  SelectList,
  SelectOption,
} from '@patternfly/react-core';
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
  const [isOpen, setIsOpen] = React.useState(false);
  const selectOptions: JSX.Element[] = React.useMemo(
    () =>
      options.map((dropdownOption, index) => {
        const key = `${dropdownOption.label}${index}`;
        return (
          <SelectOption
            key={key}
            value={dropdownOption.label}
            description={dropdownOption?.description}
          >
            {dropdownOption.label}
          </SelectOption>
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

  const selected = getDropdownLabelFromValue(currentUserPreferenceValue);

  const onSelect = (_, selection) => {
    const selectedValue = getDropdownValueFromLabel(selection);
    selectedValue !== currentUserPreferenceValue && setCurrentUserPreferenceValue(selectedValue);
    setIsOpen(false);
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
        selected={selected}
        onOpenChange={(open) => setIsOpen(open)}
        isOpen={isOpen}
        onSelect={onSelect}
        data-test={`select ${id}`}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle isFullWidth ref={toggleRef} onClick={(open) => setIsOpen(open)}>
            {selected || t('console-app~Select an option')}
          </MenuToggle>
        )}
      >
        <SelectList>{selectOptions}</SelectList>
      </Select>
    </>
  ) : (
    <Skeleton height="30px" width="100%" data-test={`select skeleton ${id}`} />
  );
};
export default UserPreferenceDropdownField;
