import { screen } from '@testing-library/react';

import { LimitRangeDetailsRow } from '../limit-range';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

describe('LimitRangeDetailsRow', () => {
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

  it('verifies the limit type as Container', () => {
    renderLimitRangeDetailsRow();

    expect(screen.getByText('Container')).toBeVisible();
  });

  it('verifies the resource type as memory', () => {
    renderLimitRangeDetailsRow();

    expect(screen.getByText('memory')).toBeVisible();
  });

  it('verifies the minimum limit value', () => {
    renderLimitRangeDetailsRow();

    expect(screen.getByText('1')).toBeVisible();
  });

  it('verifies dash for empty maximum limit', () => {
    renderLimitRangeDetailsRow();

    expect(screen.getAllByText('-')).toHaveLength(4);
  });

  it('verifies all limit range information in a table row', () => {
    renderLimitRangeDetailsRow();

    expect(screen.getByText('Container')).toBeVisible();
    expect(screen.getByText('memory')).toBeVisible();
    expect(screen.getByText('1')).toBeVisible();
    expect(screen.getAllByText('-')).toHaveLength(4);
  });
});
