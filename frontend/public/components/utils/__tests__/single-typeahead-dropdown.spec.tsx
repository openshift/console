import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { SingleTypeaheadDropdown } from '../single-typeahead-dropdown';

describe('SingleTypeaheadDropdown', () => {
  let onChange: jest.Mock;

  beforeEach(() => {
    onChange = jest.fn();
  });

  it('should render with placeholder text', async () => {
    renderWithProviders(
      <SingleTypeaheadDropdown
        items={[{ value: 'test', children: 'test' }]}
        onChange={onChange}
        selectedKey="test"
        placeholder="Select an option"
      />,
    );

    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeInTheDocument();
    expect(combobox).toHaveAttribute('placeholder', 'Select an option');
    expect(combobox).toHaveAttribute('aria-controls');
    expect(combobox).toHaveAttribute('role', 'combobox');
  });

  it('should display the clear button when input value is present', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SingleTypeaheadDropdown
        items={[{ value: 'test', children: 'test' }]}
        onChange={onChange}
        selectedKey=""
        hideClearButton={false}
      />,
    );

    const combobox = screen.getByRole('combobox');

    // Type some text into the input
    await user.click(combobox);
    await user.type(combobox, 'test');

    const clearButton = await screen.findByRole('button', { name: /clear input value/i });
    expect(clearButton).toBeVisible();
  });

  it('should not display the clear button when hideClearButton is true', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SingleTypeaheadDropdown
        items={[{ value: 'test', children: 'test' }]}
        onChange={onChange}
        selectedKey=""
        hideClearButton={true}
      />,
    );

    const combobox = screen.getByRole('combobox');

    await user.click(combobox);
    await user.type(combobox, 'test');

    await waitFor(() => {
      const clearButton = screen.queryByRole('button', { name: /clear input value/i });
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  it('should focus the first item when ArrowDown key is pressed', async () => {
    const user = userEvent.setup();
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

    const combobox = screen.getByRole('combobox');

    // Press ArrowDown to open dropdown and focus first item
    await user.click(combobox);
    await user.keyboard('{ArrowDown}');

    const firstOption = await screen.findByRole('option', { name: 'test1' });
    expect(firstOption).toBeVisible();

    // Verify the combobox has the aria-activedescendant attribute pointing to the focused item
    await waitFor(() => {
      expect(combobox).toHaveAttribute('aria-activedescendant');
    });
  });

  it('should focus the last item when ArrowUp key is pressed on the first item', async () => {
    const user = userEvent.setup();
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

    const combobox = screen.getByRole('combobox');

    // Press ArrowUp to open dropdown and focus last item
    await user.click(combobox);
    await user.keyboard('{ArrowUp}');

    expect(await screen.findByRole('option', { name: 'test1' })).toBeVisible();
    expect(await screen.findByRole('option', { name: 'test2' })).toBeVisible();

    // Verify the combobox has the aria-activedescendant attribute (should point to last item)
    await waitFor(() => {
      expect(combobox).toHaveAttribute('aria-activedescendant');
    });
  });

  it('should call onChange when an option is selected', async () => {
    const user = userEvent.setup();
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

    const combobox = screen.getByRole('combobox');

    await user.click(combobox);

    // Wait for dropdown to open and click on the first option
    const firstOption = await screen.findByRole('option', { name: 'test1' });
    await user.click(firstOption);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('test1');
    });
  });

  it('should clear the input when clear button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SingleTypeaheadDropdown
        items={[{ value: 'test', children: 'test' }]}
        onChange={onChange}
        selectedKey="test"
        hideClearButton={false}
      />,
    );

    const combobox = screen.getByRole('combobox');

    await user.click(combobox);
    await user.clear(combobox);
    await user.type(combobox, 'some text');

    const clearButton = await screen.findByRole('button', { name: /clear input value/i });
    await user.click(clearButton);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('');
    });

    expect(combobox).toHaveValue('');
  });
});
