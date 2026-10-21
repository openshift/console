import type { gridItemSpanValueShape } from '@patternfly/react-core';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../test-utils/unit-test-utils';
import type { MultiColumnFieldHeaderProps } from '../MultiColumnFieldHeader';
import MultiColumnFieldHeader from '../MultiColumnFieldHeader';

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
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should not render required label when prop is of type string[]', () => {
    const headerProps: MultiColumnFieldHeaderProps = {
      headers: ['Testing Field'],
      spans: [12 as gridItemSpanValueShape],
    };

    renderWithProviders(<MultiColumnFieldHeader {...headerProps} />);

    expect(screen.queryByText('*')).not.toBeInTheDocument();
    expect(screen.getByText('Testing Field')).toBeVisible();
  });
});
