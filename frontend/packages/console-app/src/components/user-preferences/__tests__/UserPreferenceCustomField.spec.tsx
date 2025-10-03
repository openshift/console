import { screen } from '@testing-library/react';
import { UserPreferenceFieldType } from '@console/dynamic-plugin-sdk/src/extensions/user-preferences';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import UserPreferenceCustomField from '../UserPreferenceCustomField';

describe('UserPreferenceCustomField', () => {
  const baseProps = {
    id: 'test-custom-field',
    type: UserPreferenceFieldType.custom as const,
    component: () => <div>CUSTOM_COMPONENT_RENDERED</div>,
  };

  it('should render nothing if the component prop is not provided', () => {
    renderWithProviders(<UserPreferenceCustomField {...baseProps} component={null} />);

    expect(screen.queryByText('CUSTOM_COMPONENT_RENDERED')).not.toBeInTheDocument();
  });

  it('should render the custom component with its custom props', () => {
    renderWithProviders(<UserPreferenceCustomField {...baseProps} />);

    expect(screen.getByText('CUSTOM_COMPONENT_RENDERED')).toBeVisible();
  });
});
