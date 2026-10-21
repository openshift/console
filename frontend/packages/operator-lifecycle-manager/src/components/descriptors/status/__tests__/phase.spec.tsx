import { render, screen } from '@testing-library/react';
import { Phase } from '../phase';

describe('Phase', () => {
  it('should render ban icon when status is Failed', () => {
    const status = 'Failed';
    render(<Phase status={status} />);

    expect(screen.getByText(status)).toBeVisible();
    expect(screen.getByRole('img', { hidden: true })).toBeVisible();
  });

  it('should render status text without icon when status is not Failed', () => {
    const status = 'Running';
    render(<Phase status={status} />);

    expect(screen.getByText(status)).toBeVisible();
    expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
  });
});
