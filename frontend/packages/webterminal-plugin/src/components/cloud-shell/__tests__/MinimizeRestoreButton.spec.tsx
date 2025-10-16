import { render, screen, fireEvent } from '@testing-library/react';
import { MinimizeRestoreButton } from '../MinimizeRestoreButton';

describe('MinimizeRestoreButton', () => {
  it('should render a button', () => {
    render(
      <MinimizeRestoreButton minimizeText="Minimize" restoreText="Restore" onClick={() => null} />,
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should render minimize button when minimized is true', () => {
    render(
      <MinimizeRestoreButton
        minimizeText="Minimize"
        restoreText="Restore"
        minimize
        onClick={() => null}
      />,
    );
    expect(screen.getByRole('button', { name: 'Minimize' })).toBeInTheDocument();
  });

  it('should render restore button when minimized is false', () => {
    render(
      <MinimizeRestoreButton
        minimizeText="Minimize"
        restoreText="Restore"
        minimize={false}
        onClick={() => null}
      />,
    );
    expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument();
  });

  it('should invoke onclose callback with argument true when minimized button clicked and false when restore button clicked', async () => {
    const onClose = jest.fn();

    const { rerender } = render(
      <MinimizeRestoreButton
        minimizeText="Minimize"
        restoreText="Restore"
        minimize
        onClick={onClose}
      />,
    );

    expect(screen.getByRole('button', { name: 'Minimize' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Restore' })).not.toBeInTheDocument();

    // click on minimize button
    await fireEvent.click(screen.getByRole('button', { name: 'Minimize' }));
    expect(onClose).toHaveBeenLastCalledWith(true);

    // Re-render with minimize=false to test restore button
    rerender(
      <MinimizeRestoreButton
        minimizeText="Minimize"
        restoreText="Restore"
        minimize={false}
        onClick={onClose}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Minimize' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument();

    // click on restore button
    await fireEvent.click(screen.getByRole('button', { name: 'Restore' }));
    expect(onClose).toHaveBeenLastCalledWith(false);
  });
});
