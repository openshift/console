import * as React from 'react';
import { Checkbox, Skeleton } from '@patternfly/react-core';
import { useUserSettings } from '@console/shared';

type UserPreferenceInputCheckboxProps = {
  id: string;
  description: string;
  userSettingKey: string;
  trueValue: string;
  falseValue: string;
};

const UserPreferenceInputCheckbox: React.FC<UserPreferenceInputCheckboxProps> = ({
  id,
  description,
  userSettingKey,
  trueValue,
  falseValue,
}) => {
  // resources and calls to hooks
  const [
    currentUserSettingValue,
    setCurrentUserSettingValue,
    currentUserSettingValueLoaded,
  ] = useUserSettings<string>(userSettingKey);

  const loaded: boolean = currentUserSettingValueLoaded;

  // utils and callbacks
  const getCheckboxValue = (checked: boolean): string => (checked ? trueValue : falseValue);

  const onChange = (checked) => {
    const checkedValue: string = getCheckboxValue(checked);
    checkedValue !== currentUserSettingValue && setCurrentUserSettingValue(checkedValue);
  };

  return loaded ? (
    <Checkbox
      id={id}
      label={description}
      isChecked={currentUserSettingValue === trueValue}
      onChange={onChange}
      data-test={`checkbox ${id}`}
    />
  ) : (
    <Skeleton height="30px" width="256px" data-test={`dropdown skeleton ${id}`} />
  );
};
export default UserPreferenceInputCheckbox;
