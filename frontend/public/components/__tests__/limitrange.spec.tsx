import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LimitRangeDetailsRow } from '../limit-range';

describe(LimitRangeDetailsRow.displayName, () => {
  const limitContent = {
    max: '',
    min: '1',
    default: '',
    defaultRequest: '',
    maxLimitRequestRatio: '',
  };

  const renderLimitRangeDetailsRow = () => {
    return render(
      <table>
        <tbody>
          <LimitRangeDetailsRow limitType={'Container'} resource={'memory'} limit={limitContent} />
        </tbody>
      </table>,
    );
  };

  it('displays the limit type as Container', () => {
    renderLimitRangeDetailsRow();

    // User should see the limit type displayed
    expect(screen.getByText('Container')).toBeInTheDocument();
  });

  it('displays the resource type as memory', () => {
    renderLimitRangeDetailsRow();

    // User should see the resource type displayed
    expect(screen.getByText('memory')).toBeInTheDocument();
  });

  it('displays the minimum limit value', () => {
    renderLimitRangeDetailsRow();

    // User should see the minimum limit value
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('displays dash for empty maximum limit', () => {
    renderLimitRangeDetailsRow();

    // User should see dash when max limit is empty
    expect(screen.getAllByText('-')).toHaveLength(4); // max, default, defaultRequest, maxLimitRequestRatio
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
