import type { FC } from 'react';
import { UserPreferenceCustomField as CustomFieldType } from '@console/dynamic-plugin-sdk/src';
import { ErrorBoundaryInline } from '@console/shared/src/components/error';
import { UserPreferenceFieldProps } from './types';

type UserPreferenceCustomFieldProps = UserPreferenceFieldProps<CustomFieldType>;

const UserPreferenceCustomField: FC<UserPreferenceCustomFieldProps> = ({
  component: CustomComponent,
  props: customComponentProps,
}) =>
  CustomComponent ? (
    <ErrorBoundaryInline>
      <CustomComponent {...customComponentProps} />
    </ErrorBoundaryInline>
  ) : null;
export default UserPreferenceCustomField;
