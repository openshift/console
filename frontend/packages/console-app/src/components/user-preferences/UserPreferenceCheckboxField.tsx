import * as React from 'react';
import { Checkbox, Skeleton } from '@patternfly/react-core';
import {
  UserPreferenceCheckboxField as CheckboxFieldType,
  UserPreferenceCheckboxFieldValue,
} from '@console/dynamic-plugin-sdk/src';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { useUserSettings } from '@console/shared/src/hooks/useUserSettings';
import { UserPreferenceFieldProps } from './types';

import './UserPreferenceField.scss';

type UserPreferenceCheckboxFieldProps = UserPreferenceFieldProps<CheckboxFieldType>;

const UserPreferenceCheckboxField: React.FC<UserPreferenceCheckboxFieldProps> = ({
  id,
  label,
  userSettingsKey,
  trueValue,
  falseValue,
  defaultValue,
  description,
}) => {
  // resources and calls to hooks
  const [
    currentUserPreferenceValue,
    setCurrentUserPreferenceValue,
    currentUserPreferenceValueLoaded,
  ] = useUserSettings<UserPreferenceCheckboxFieldValue>(userSettingsKey);
  const fireTelemetryEvent = useTelemetry();

  const loaded: boolean = currentUserPreferenceValueLoaded;

  if (defaultValue && loaded && !currentUserPreferenceValue) {
    setCurrentUserPreferenceValue(defaultValue);
  }

  // utils and callbacks
  const onChange = (_event, checked: boolean) => {
    const checkedValue: UserPreferenceCheckboxFieldValue = checked ? trueValue : falseValue;
    checkedValue !== currentUserPreferenceValue && setCurrentUserPreferenceValue(checkedValue);
    fireTelemetryEvent('User Preference Changed', {
      property: userSettingsKey,
      value: checkedValue,
    });
  };

  return loaded ? (
    <>
      {description && <div className="co-user-preference-field--description">{description}</div>}
      <Checkbox
        id={id}
        label={label}
        isChecked={currentUserPreferenceValue === trueValue}
        data-checked-state={currentUserPreferenceValue === trueValue}
        onChange={onChange}
        data-test={`checkbox ${id}`}
      />
    </>
  ) : (
    <Skeleton height="30px" width="100%" data-test={`dropdown skeleton ${id}`} />
  );
};
export default UserPreferenceCheckboxField;
