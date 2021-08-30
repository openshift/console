import * as React from 'react';
import { UserPreferenceCustomField as CustomFieldType } from '@console/dynamic-plugin-sdk/src';
import { UserPreferenceFieldProps } from './types';

type UserPreferenceCustomFieldProps = UserPreferenceFieldProps<CustomFieldType>;

const UserPreferenceCustomField: React.FC<UserPreferenceCustomFieldProps> = ({
  component: CustomComponent,
  props: customComponentProps,
}) => (CustomComponent ? <CustomComponent {...customComponentProps} /> : null);
export default UserPreferenceCustomField;
