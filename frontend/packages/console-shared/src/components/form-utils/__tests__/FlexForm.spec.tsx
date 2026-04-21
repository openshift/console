import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import FlexForm from '../FlexForm';

describe('FlexForm', () => {
  it('should render a form element', () => {
    renderWithProviders(<FlexForm onSubmit={() => {}} aria-label="flex form" />);

    const formElement = screen.getByRole('form', { name: 'flex form' });
    expect(formElement).toBeVisible();
    expect(formElement.tagName).toBe('FORM');
  });

  it('should add styles for flex layout', () => {
    renderWithProviders(<FlexForm onSubmit={() => {}} aria-label="flex form" />);

    const formElement = screen.getByRole('form', { name: 'flex form' });
    expect(formElement).toHaveStyle({
      display: 'flex',
      flex: '1',
      flexDirection: 'column',
    });
  });

  it('should preserve form props including onSubmit', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn((e) => e.preventDefault());
    renderWithProviders(
      <FlexForm onSubmit={handleSubmit} aria-label="flex form">
        <button type="submit">Submit</button>
      </FlexForm>,
    );

    const formElement = screen.getByRole('form', { name: 'flex form' });
    expect(formElement).toHaveAttribute('style');

    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it('should render children correctly', () => {
    renderWithProviders(
      <FlexForm onSubmit={() => {}}>
        <input type="text" name="test-input" />
        <button type="submit">Submit</button>
      </FlexForm>,
    );

    expect(screen.getByRole('textbox')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeVisible();
  });

  it('should handle form submission', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn((e) => e.preventDefault());

    renderWithProviders(
      <FlexForm onSubmit={handleSubmit}>
        <button type="submit">Submit</button>
      </FlexForm>,
    );

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});
