import * as React from 'react';
import { render, screen, configure } from '@testing-library/react';
import { UserPreferenceFieldType } from '@console/dynamic-plugin-sdk/src/extensions/user-preferences';
import UserPreferenceCustomField from '../UserPreferenceCustomField';

describe('UserPreferenceCustomField', () => {
  type UserPreferenceCustomFieldProps = React.ComponentProps<typeof UserPreferenceCustomField>;
  const props: UserPreferenceCustomFieldProps = {
    type: UserPreferenceFieldType.custom,
    id: 'id',
    component: (componentProps) => <span {...componentProps} />,
    props: { 'data-test': 'test custom component' },
  };

  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  it('should render nothing if component does not exist', () => {
    const { container } = render(<UserPreferenceCustomField {...props} component={null} />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('test custom component')).not.toBeInTheDocument();
  });

  it('should render custom component with custom props if component exists', () => {
    render(<UserPreferenceCustomField {...props} />);
    expect(screen.getByTestId('test custom component')).toBeInTheDocument();
  });
});
