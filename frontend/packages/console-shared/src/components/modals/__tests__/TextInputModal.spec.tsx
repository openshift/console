import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import { TextInputModal } from '../TextInputModal';

describe('TextInputModal', () => {
  const mockCloseModal = jest.fn();
  const mockOnSubmit = jest.fn();

  const defaultProps = {
    closeModal: mockCloseModal,
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
    expect(mockCloseModal).toHaveBeenCalled();
  });

  it('should update value when input changes', () => {
    renderWithProviders(<TextInputModal {...defaultProps} />);

    const input = screen.getByTestId('input-value') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'new-value' } });

    expect(input.value).toBe('new-value');
  });

  it('should call closeModal when cancel button is clicked', () => {
    renderWithProviders(<TextInputModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(mockCloseModal).toHaveBeenCalled();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should show error when submitting empty value', async () => {
    renderWithProviders(<TextInputModal {...defaultProps} />);

    const input = screen.getByTestId('input-value') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(mockCloseModal).not.toHaveBeenCalled();
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
    expect(mockCloseModal).not.toHaveBeenCalled();
  });

  it('should clear error when input changes', async () => {
    const mockValidator = jest.fn().mockReturnValue('Invalid value');

    renderWithProviders(<TextInputModal {...defaultProps} validator={mockValidator} />);

    // Trigger validation error
    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid value')).toBeInTheDocument();
    });

    // Change input to clear error
    const input = screen.getByTestId('input-value') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'new-value' } });

    expect(screen.queryByText('Invalid value')).not.toBeInTheDocument();
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

  it('should prevent submission when value is empty', async () => {
    renderWithProviders(<TextInputModal {...defaultProps} initialValue="" />);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    // Should show validation error instead of calling onSubmit
    await waitFor(() => {
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
