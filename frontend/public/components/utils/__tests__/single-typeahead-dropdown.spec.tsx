import { screen, act, waitFor, fireEvent } from '@testing-library/react';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { SingleTypeaheadDropdown } from '../single-typeahead-dropdown';

describe('SingleTypeaheadDropdown', () => {
  let onChange: jest.Mock;

  beforeEach(() => {
    onChange = jest.fn();
  });

  it('should render with placeholder text', async () => {
    await act(async () => {
      renderWithProviders(
        <SingleTypeaheadDropdown
          items={[{ value: 'test', children: 'test' }]}
          onChange={onChange}
          selectedKey="test"
          placeholder="Select an option"
        />,
      );
    });

    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeInTheDocument();
    expect(combobox).toHaveAttribute('placeholder', 'Select an option');
    expect(combobox).toHaveAttribute('aria-controls');
    expect(combobox).toHaveAttribute('role', 'combobox');
  });

  it('should display the clear button when input value is present', async () => {
    await act(async () => {
      renderWithProviders(
        <SingleTypeaheadDropdown
          items={[{ value: 'test', children: 'test' }]}
          onChange={onChange}
          selectedKey=""
          hideClearButton={false}
        />,
      );
    });

    const combobox = screen.getByRole('combobox');

    // Type some text into the input
    await act(async () => {
      fireEvent.change(combobox, { target: { value: 'test' } });
    });

    await waitFor(() => {
      const clearButton = screen.getByRole('button', { name: /clear input value/i });
      expect(clearButton).toBeInTheDocument();
      expect(clearButton).toBeVisible();
    });
  });

  it('should not display the clear button when hideClearButton is true', async () => {
    await act(async () => {
      renderWithProviders(
        <SingleTypeaheadDropdown
          items={[{ value: 'test', children: 'test' }]}
          onChange={onChange}
          selectedKey=""
          hideClearButton={true}
        />,
      );
    });

    const combobox = screen.getByRole('combobox');

    await act(async () => {
      fireEvent.change(combobox, { target: { value: 'test' } });
    });

    await waitFor(() => {
      const clearButton = screen.queryByRole('button', { name: /clear input value/i });
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  it('should focus the first item when ArrowDown key is pressed', async () => {
    await act(async () => {
      renderWithProviders(
        <SingleTypeaheadDropdown
          items={[
            { value: 'test1', children: 'test1' },
            { value: 'test2', children: 'test2' },
          ]}
          onChange={onChange}
          selectedKey=""
        />,
      );
    });

    const combobox = screen.getByRole('combobox');

    // Press ArrowDown to open dropdown and focus first item
    await act(async () => {
      fireEvent.click(combobox);
      fireEvent.keyDown(combobox, { key: 'ArrowDown' });
    });

    await waitFor(() => {
      const firstOption = screen.getByRole('option', { name: 'test1' });
      expect(firstOption).toBeInTheDocument();
      expect(firstOption).toBeVisible();
    });

    // Verify the combobox has the aria-activedescendant attribute pointing to the focused item
    await waitFor(() => {
      expect(combobox).toHaveAttribute('aria-activedescendant');
    });
  });

  it('should focus the last item when ArrowUp key is pressed on the first item', async () => {
    await act(async () => {
      renderWithProviders(
        <SingleTypeaheadDropdown
          items={[
            { value: 'test1', children: 'test1' },
            { value: 'test2', children: 'test2' },
          ]}
          onChange={onChange}
          selectedKey=""
        />,
      );
    });

    const combobox = screen.getByRole('combobox');

    // Press ArrowUp to open dropdown and focus last item
    await act(async () => {
      fireEvent.click(combobox);
      fireEvent.keyDown(combobox, { key: 'ArrowUp' });
    });

    await waitFor(() => {
      const firstOption = screen.getByRole('option', { name: 'test1' });
      const secondOption = screen.getByRole('option', { name: 'test2' });
      expect(firstOption).toBeInTheDocument();
      expect(secondOption).toBeInTheDocument();
      expect(firstOption).toBeVisible();
      expect(secondOption).toBeVisible();
    });

    // Verify the combobox has the aria-activedescendant attribute (should point to last item)
    await waitFor(() => {
      expect(combobox).toHaveAttribute('aria-activedescendant');
    });
  });

  it('should call onChange when an option is selected', async () => {
    await act(async () => {
      renderWithProviders(
        <SingleTypeaheadDropdown
          items={[
            { value: 'test1', children: 'test1' },
            { value: 'test2', children: 'test2' },
          ]}
          onChange={onChange}
          selectedKey=""
        />,
      );
    });

    const combobox = screen.getByRole('combobox');

    await act(async () => {
      fireEvent.click(combobox);
    });

    // Wait for dropdown to open and click on the first option
    await waitFor(() => {
      const firstOption = screen.getByRole('option', { name: 'test1' });
      expect(firstOption).toBeVisible();
    });

    const firstOption = screen.getByRole('option', { name: 'test1' });
    await act(async () => {
      fireEvent.click(firstOption);
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('test1');
    });
  });

  it('should clear the input when clear button is clicked', async () => {
    await act(async () => {
      renderWithProviders(
        <SingleTypeaheadDropdown
          items={[{ value: 'test', children: 'test' }]}
          onChange={onChange}
          selectedKey="test"
          hideClearButton={false}
        />,
      );
    });

    const combobox = screen.getByRole('combobox');

    await act(async () => {
      fireEvent.change(combobox, { target: { value: 'some text' } });
    });

    await waitFor(() => {
      const clearButton = screen.getByRole('button', { name: /clear input value/i });
      expect(clearButton).toBeVisible();
    });

    const clearButton = screen.getByRole('button', { name: /clear input value/i });
    await act(async () => {
      fireEvent.click(clearButton);
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('');
    });

    expect(combobox).toHaveValue('');
  });
});
