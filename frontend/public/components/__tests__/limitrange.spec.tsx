import { screen } from '@testing-library/react';

import { LimitRangeDetailsRow } from '../limit-range';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

describe(LimitRangeDetailsRow.displayName, () => {
  const limitContent = {
    max: '',
    min: '1',
    default: '',
    defaultRequest: '',
    maxLimitRequestRatio: '',
  };

  const renderLimitRangeDetailsRow = () => {
    return renderWithProviders(
      <table>
        <tbody>
          <LimitRangeDetailsRow limitType={'Container'} resource={'memory'} limit={limitContent} />
        </tbody>
      </table>,
    );
  };

  it('displays the limit type as Container', () => {
    renderLimitRangeDetailsRow();

    expect(screen.getByText('Container')).toBeInTheDocument();
  });

  it('displays the resource type as memory', () => {
    renderLimitRangeDetailsRow();

    expect(screen.getByText('memory')).toBeInTheDocument();
  });

  it('displays the minimum limit value', () => {
    renderLimitRangeDetailsRow();

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('displays dash for empty maximum limit', () => {
    renderLimitRangeDetailsRow();

    expect(screen.getAllByText('-')).toHaveLength(4);
  });

  it('displays all limit range information in a table row', () => {
    renderLimitRangeDetailsRow();

    // User should see all the limit range data displayed
    expect(screen.getByText('Container')).toBeInTheDocument();
    expect(screen.getByText('memory')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    // Four dashes for empty values (max, default, defaultRequest, maxLimitRequestRatio)
    expect(screen.getAllByText('-')).toHaveLength(4);
  });
});
