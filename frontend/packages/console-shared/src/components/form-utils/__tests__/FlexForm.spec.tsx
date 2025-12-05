import { screen, fireEvent } from '@testing-library/react';
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

  it('should preserve form props including onSubmit', () => {
    const handleSubmit = jest.fn((e) => e.preventDefault());
    renderWithProviders(<FlexForm onSubmit={handleSubmit} aria-label="flex form" />);

    const formElement = screen.getByRole('form', { name: 'flex form' });
    expect(formElement).toHaveAttribute('style');

    fireEvent.submit(formElement);
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

  it('should handle form submission', () => {
    const handleSubmit = jest.fn((e) => e.preventDefault());

    renderWithProviders(
      <FlexForm onSubmit={handleSubmit}>
        <button type="submit">Submit</button>
      </FlexForm>,
    );

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    fireEvent.click(submitButton);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});
