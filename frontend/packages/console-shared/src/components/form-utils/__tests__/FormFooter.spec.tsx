import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import type { FormFooterProps } from '../form-utils-types';
import FormFooter from '../FormFooter';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe = () => {};

  unobserve = () => {};

  disconnect = () => {};
};

describe('FormFooter', () => {
  let props: FormFooterProps;

  beforeEach(() => {
    props = {
      errorMessage: 'error',
      submitLabel: 'Create',
      resetLabel: 'Reset',
      cancelLabel: 'Cancel',
      handleReset: jest.fn(),
      handleCancel: jest.fn(),
      sticky: false,
      disableSubmit: false,
      isSubmitting: false,
    };
  });

  it('should contain submit, reset and cancel button', () => {
    renderWithProviders(<FormFooter {...props} />);

    expect(screen.getByRole('button', { name: 'Create' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  it('should contain right labels in the submit and reset button', () => {
    renderWithProviders(<FormFooter {...props} />);

    expect(screen.getByRole('button', { name: 'Create' })).toHaveTextContent('Create');
    expect(screen.getByRole('button', { name: 'Reset' })).toHaveTextContent('Reset');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveTextContent('Cancel');
  });

  it('should be able to configure data-test-id and labels', () => {
    renderWithProviders(
      <FormFooter
        {...props}
        submitLabel="submit-lbl"
        resetLabel="reset-lbl"
        cancelLabel="cancel-lbl"
      />,
    );

    expect(screen.getByRole('button', { name: 'submit-lbl' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'reset-lbl' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'cancel-lbl' })).toBeVisible();
  });

  it('should render with sticky prop', () => {
    renderWithProviders(<FormFooter {...props} sticky />);

    // Verify buttons still render when sticky is enabled
    expect(screen.getByRole('button', { name: 'Create' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  it('should have submit button when handle submit is not passed', () => {
    renderWithProviders(<FormFooter {...props} />);

    expect(screen.getByRole('button', { name: 'Create' })).toHaveAttribute('type', 'submit');
  });

  it('should not have submit button when handle submit callback is passed', () => {
    renderWithProviders(<FormFooter {...props} handleSubmit={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Create' })).toHaveAttribute('type', 'button');
  });

  it('should call the handler when a button is clicked', () => {
    const handleSubmit = jest.fn();
    renderWithProviders(<FormFooter {...props} handleSubmit={handleSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(props.handleReset).toHaveBeenCalledTimes(1);
    expect(props.handleCancel).toHaveBeenCalledTimes(1);
  });
});
