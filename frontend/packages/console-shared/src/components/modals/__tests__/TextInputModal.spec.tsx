import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('should call onSubmit with value when save button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TextInputModal {...defaultProps} />);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    await user.click(saveButton);

    expect(mockOnSubmit).toHaveBeenCalledWith('initial-value');
    expect(mockCloseOverlay).toHaveBeenCalled();
  });

  it('should update value when input changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TextInputModal {...defaultProps} />);

    const input = screen.getByTestId('input-value') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'new-value');

    expect(input.value).toBe('new-value');
  });

  it('should call closeOverlay when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TextInputModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    expect(mockCloseOverlay).toHaveBeenCalled();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should show error when submitting empty value and isRequired is true', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TextInputModal {...defaultProps} isRequired />);

    const input = screen.getByTestId('input-value') as HTMLInputElement;
    await user.clear(input);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    await user.click(saveButton);

    expect(await screen.findByText('This field is required')).toBeVisible();

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(mockCloseOverlay).not.toHaveBeenCalled();
  });

  it('should call validator and show error when validation fails', async () => {
    const user = userEvent.setup();
    const mockValidator = jest.fn().mockReturnValue('Invalid value');

    renderWithProviders(<TextInputModal {...defaultProps} validator={mockValidator} />);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    await user.click(saveButton);

    expect(await screen.findByText('Invalid value')).toBeVisible();

    expect(mockValidator).toHaveBeenCalledWith('initial-value');
    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(mockCloseOverlay).not.toHaveBeenCalled();
  });

  it('should allow submission after fixing validation error', async () => {
    const user = userEvent.setup();
    const mockValidator = jest.fn().mockReturnValueOnce('Invalid value').mockReturnValueOnce(null);

    renderWithProviders(<TextInputModal {...defaultProps} validator={mockValidator} />);

    // Trigger validation error
    const saveButton = screen.getByRole('button', { name: 'Save' });
    await user.click(saveButton);

    expect(await screen.findByText('Invalid value')).toBeVisible();

    // Change input and retry
    const input = screen.getByTestId('input-value') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'valid-value');
    await user.click(saveButton);

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

  it('should allow empty value submission when isRequired is false', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TextInputModal {...defaultProps} initialValue="" isRequired={false} />);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    await user.click(saveButton);

    expect(mockOnSubmit).toHaveBeenCalledWith('');
    expect(mockCloseOverlay).toHaveBeenCalled();
  });

  it('should show required indicator on label when isRequired is true', () => {
    renderWithProviders(<TextInputModal {...defaultProps} isRequired />);

    // PatternFly adds required attribute to the input when isRequired is true
    const input = screen.getByTestId('input-value');
    expect(input).toBeRequired();
  });

  it('should submit form when Enter is pressed in input field', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TextInputModal {...defaultProps} />);

    const input = screen.getByTestId('input-value') as HTMLInputElement;
    await user.click(input);
    await user.keyboard('{Enter}');

    expect(mockOnSubmit).toHaveBeenCalledWith('initial-value');
    expect(mockCloseOverlay).toHaveBeenCalled();
  });

  it('should prevent submission when value is empty and isRequired is true', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TextInputModal {...defaultProps} initialValue="" isRequired />);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    await user.click(saveButton);

    // Should show validation error instead of calling onSubmit
    expect(await screen.findByText('This field is required')).toBeVisible();

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
