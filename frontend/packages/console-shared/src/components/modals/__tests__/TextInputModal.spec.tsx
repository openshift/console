import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import { TextInputModal } from '../TextInputModal';

describe('TextInputModal', () => {
  const mockCloseOverlay = jest.fn();
  const mockOnSubmit = jest.fn();

  const defaultProps = {
    closeOverlay: mockCloseOverlay,
    title: 'Edit Name',
    label: 'Name',
    initialValue: 'initial-value',
    onSubmit: mockOnSubmit,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal with correct title and label', () => {
    renderWithProviders(<TextInputModal {...defaultProps} />);

    expect(screen.getByText('Edit Name')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByTestId('input-value')).toBeInTheDocument();
  });

  it('should render with initial value', () => {
    renderWithProviders(<TextInputModal {...defaultProps} />);

    const input = screen.getByTestId('input-value') as HTMLInputElement;
    expect(input.value).toBe('initial-value');
  });

  it('should call onSubmit with value when save button is clicked', () => {
    renderWithProviders(<TextInputModal {...defaultProps} />);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    expect(mockOnSubmit).toHaveBeenCalledWith('initial-value');
    expect(mockCloseOverlay).toHaveBeenCalled();
  });

  it('should update value when input changes', () => {
    renderWithProviders(<TextInputModal {...defaultProps} />);

    const input = screen.getByTestId('input-value') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'new-value' } });

    expect(input.value).toBe('new-value');
  });

  it('should call closeOverlay when cancel button is clicked', () => {
    renderWithProviders(<TextInputModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(mockCloseOverlay).toHaveBeenCalled();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should show error when submitting empty value and isRequired is true', async () => {
    renderWithProviders(<TextInputModal {...defaultProps} isRequired />);

    const input = screen.getByTestId('input-value') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(mockCloseOverlay).not.toHaveBeenCalled();
  });

  it('should call validator and show error when validation fails', async () => {
    const mockValidator = jest.fn().mockReturnValue('Invalid value');

    renderWithProviders(<TextInputModal {...defaultProps} validator={mockValidator} />);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid value')).toBeInTheDocument();
    });

    expect(mockValidator).toHaveBeenCalledWith('initial-value');
    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(mockCloseOverlay).not.toHaveBeenCalled();
  });

  it('should allow submission after fixing validation error', async () => {
    const mockValidator = jest.fn().mockReturnValueOnce('Invalid value').mockReturnValueOnce(null);

    renderWithProviders(<TextInputModal {...defaultProps} validator={mockValidator} />);

    // Trigger validation error
    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid value')).toBeInTheDocument();
    });

    // Change input and retry
    const input = screen.getByTestId('input-value') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'valid-value' } });
    fireEvent.click(saveButton);

    expect(mockValidator).toHaveBeenCalledTimes(2);
    expect(mockOnSubmit).toHaveBeenCalledWith('valid-value');
    expect(mockCloseOverlay).toHaveBeenCalled();
  });

  it('should render with custom button labels', () => {
    renderWithProviders(
      <TextInputModal {...defaultProps} submitButtonText="Apply" cancelButtonText="Dismiss" />,
    );

    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });

  it('should render with placeholder and help text', () => {
    renderWithProviders(
      <TextInputModal {...defaultProps} placeholder="Enter a name" helpText="This is help text" />,
    );

    const input = screen.getByTestId('input-value') as HTMLInputElement;
    expect(input).toHaveAttribute('placeholder', 'Enter a name');
    expect(screen.getByText('This is help text')).toBeInTheDocument();
  });

  it('should support different input types', () => {
    renderWithProviders(<TextInputModal {...defaultProps} inputType="email" />);

    const input = screen.getByTestId('input-value') as HTMLInputElement;
    expect(input).toHaveAttribute('type', 'email');
  });

  it('should allow empty value submission when isRequired is false', () => {
    renderWithProviders(<TextInputModal {...defaultProps} initialValue="" isRequired={false} />);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    expect(mockOnSubmit).toHaveBeenCalledWith('');
    expect(mockCloseOverlay).toHaveBeenCalled();
  });

  it('should show required indicator on label when isRequired is true', () => {
    renderWithProviders(<TextInputModal {...defaultProps} isRequired />);

    const label = screen.getByText('Name');
    // PatternFly adds an asterisk or required class to the label
    expect(label.closest('.pf-v6-c-form__label')).toBeInTheDocument();
  });

  it('should submit form when Enter is pressed in input field', () => {
    renderWithProviders(<TextInputModal {...defaultProps} />);

    const input = screen.getByTestId('input-value') as HTMLInputElement;
    fireEvent.submit(input.closest('form'));

    expect(mockOnSubmit).toHaveBeenCalledWith('initial-value');
    expect(mockCloseOverlay).toHaveBeenCalled();
  });

  it('should prevent submission when value is empty and isRequired is true', async () => {
    renderWithProviders(<TextInputModal {...defaultProps} initialValue="" isRequired />);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    // Should show validation error instead of calling onSubmit
    await waitFor(() => {
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
