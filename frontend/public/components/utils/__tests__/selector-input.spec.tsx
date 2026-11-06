import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { SelectorInput } from '../selector-input';

describe('SelectorInput', () => {
  const defaultProps = {
    tags: [],
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('static methods', () => {
    it('arrayify converts object to key=value strings', () => {
      expect(SelectorInput.arrayify({ app: 'frontend', env: 'prod' })).toEqual([
        'app=frontend',
        'env=prod',
      ]);
      expect(SelectorInput.arrayify({ app: null })).toEqual(['app']);
      expect(SelectorInput.arrayify({})).toEqual([]);
    });

    it('objectify converts key=value strings to object', () => {
      expect(SelectorInput.objectify(['app=frontend', 'env=prod'])).toEqual({
        app: 'frontend',
        env: 'prod',
      });
      expect(SelectorInput.objectify(['app'])).toEqual({ app: null });
      expect(SelectorInput.objectify([])).toEqual({});
    });

    it('arrayObjectsToArrayStrings converts requirement objects to strings', () => {
      const input = [
        { key: 'app', operator: 'In', values: ['frontend', 'backend'] },
        { key: 'env', operator: 'NotIn', values: ['test'] },
      ];
      expect(SelectorInput.arrayObjectsToArrayStrings(input)).toEqual([
        'app in (frontend,backend)',
        'env notin (test)',
      ]);
    });

    it('arrayToArrayOfObjects converts requirement strings to objects', () => {
      expect(SelectorInput.arrayToArrayOfObjects(['app in (frontend,backend)'])).toEqual([
        { key: 'app', operator: 'In', values: ['frontend', 'backend'] },
      ]);
    });
  });

  describe('rendering', () => {
    it('renders input field with placeholder and existing tags', () => {
      renderWithProviders(<SelectorInput {...defaultProps} tags={['app=frontend', 'env=prod']} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', '');
      expect(screen.getByText('app=frontend')).toBeVisible();
      expect(screen.getByText('env=prod')).toBeVisible();
    });

    it('renders default placeholder when no tags exist', () => {
      renderWithProviders(<SelectorInput {...defaultProps} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'app=frontend');
    });
  });

  describe('validation', () => {
    it('keeps input while Enter confirms an IME candidate', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SelectorInput {...defaultProps} />);
      const input = screen.getByRole('textbox');
      await user.type(input, 'stable');

      // userEvent does not support IME composition keyboard events.
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        keyCode: 13,
        isComposing: true,
        bubbles: true,
        cancelable: true,
      });
      act(() => {
        input.dispatchEvent(event);
      });

      expect(input).toHaveValue('stable');
      expect(event.defaultPrevented).toBe(false);
      expect(defaultProps.onChange).not.toHaveBeenCalled();
      await user.keyboard('{Enter}');
      expect(defaultProps.onChange).toHaveBeenCalledWith(['stable']);
      expect(input).toHaveValue('');
    });

    it('shows invalid state for malformed input and clears when corrected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SelectorInput {...defaultProps} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'invalid tag');
      await waitFor(() => expect(input).toHaveClass('invalid-tag'));

      await user.clear(input);
      await waitFor(() => expect(input).not.toHaveClass('invalid-tag'));
    });

    it('calls onValidationChange when validation state changes', async () => {
      const user = userEvent.setup();
      const onValidationChange = jest.fn();
      renderWithProviders(
        <SelectorInput {...defaultProps} onValidationChange={onValidationChange} />,
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'invalid tag');
      await waitFor(() => expect(onValidationChange).toHaveBeenCalledWith(false));
    });
  });

  describe('tag removal', () => {
    it('keeps existing tags when Backspace is used during IME composition', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SelectorInput {...defaultProps} tags={['app=frontend']} />);
      const input = screen.getByRole('textbox');
      await user.click(input);

      // userEvent does not support IME composition keyboard events.
      const event = new KeyboardEvent('keydown', {
        key: 'Backspace',
        keyCode: 8,
        isComposing: true,
        bubbles: true,
        cancelable: true,
      });
      act(() => {
        input.dispatchEvent(event);
      });

      expect(screen.getByText('app=frontend')).toBeVisible();
      expect(defaultProps.onChange).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);

      // TagsInput matches Backspace by keyCode, which userEvent does not populate.
      act(() => {
        input.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Backspace', keyCode: 8, bubbles: true }),
        );
      });
      expect(defaultProps.onChange).toHaveBeenCalledWith([]);
      expect(screen.queryByText('app=frontend')).not.toBeInTheDocument();
    });

    it('calls onChange when close button is clicked', async () => {
      const onChange = jest.fn();
      renderWithProviders(
        <SelectorInput {...defaultProps} tags={['app=frontend', 'env=prod']} onChange={onChange} />,
      );

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'Close app=frontend' }));
      await waitFor(() => expect(onChange).toHaveBeenCalled());
    });
  });
});
