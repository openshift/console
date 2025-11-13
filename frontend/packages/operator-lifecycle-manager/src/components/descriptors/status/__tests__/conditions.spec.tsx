import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { testResourceInstance } from '../../../../../mocks';
import { StatusCapability } from '../../types';
import { DescriptorConditions } from '../conditions';

describe('Conditions descriptor', () => {
  const descriptor = {
    path: 'testConditions',
    displayName: 'Test Conditions',
    description: '',
    'x-descriptors': [StatusCapability.conditions],
  };

  it('should render conditions table for conditions status descriptor', () => {
    renderWithProviders(
      <DescriptorConditions descriptor={descriptor} obj={testResourceInstance} schema={{}} />,
    );

    // Assert section heading is displayed
    expect(screen.getByText('Test Conditions')).toBeVisible();

    // Assert conditions
    expect(screen.getByText('FooType')).toBeVisible();
    expect(screen.getByText('Foo message')).toBeVisible();
    expect(screen.getByText('FooReason')).toBeVisible();

    expect(screen.getByText('BarType')).toBeVisible();
    expect(screen.getByText('Bar message')).toBeVisible();
    expect(screen.getByText('BarReason')).toBeVisible();

    // Verify both conditions show "True" status
    const trueStatuses = screen.getAllByText('True');
    expect(trueStatuses).toHaveLength(2);
  });

  it('should handle missing conditions gracefully', () => {
    const objWithoutConditions = { ...testResourceInstance, status: {} };
    renderWithProviders(
      <DescriptorConditions descriptor={descriptor} obj={objWithoutConditions} schema={{}} />,
    );

    // User should not see the conditions heading or any condition data
    expect(screen.queryByText('Test Conditions')).not.toBeInTheDocument();
    expect(screen.queryByText('FooType')).not.toBeInTheDocument();
    expect(screen.queryByText('BarType')).not.toBeInTheDocument();
  });
});
