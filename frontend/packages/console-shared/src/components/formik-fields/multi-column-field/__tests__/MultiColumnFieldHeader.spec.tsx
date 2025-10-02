import { gridItemSpanValueShape } from '@patternfly/react-core';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../test-utils/unit-test-utils';
import MultiColumnFieldHeader, { MultiColumnFieldHeaderProps } from '../MultiColumnFieldHeader';

describe('MultiColumnFieldHeader', () => {
  it('should render required label when prop is of type Object[] with property required set to true', () => {
    const headerProps: MultiColumnFieldHeaderProps = {
      headers: [
        {
          name: 'Test Label',
          required: true,
        },
      ],
      spans: [12 as gridItemSpanValueShape],
    };

    renderWithProviders(<MultiColumnFieldHeader {...headerProps} />);

    expect(screen.getByText('Test Label')).toBeVisible();
  });

  it('should not render required label when prop is of type string[]', () => {
    const headerProps: MultiColumnFieldHeaderProps = {
      headers: ['Testing Field'],
      spans: [12 as gridItemSpanValueShape],
    };

    const { container } = renderWithProviders(<MultiColumnFieldHeader {...headerProps} />);

    expect(container.textContent).not.toContain('*');
    expect(screen.getByText('Testing Field')).toBeVisible();
  });
});
