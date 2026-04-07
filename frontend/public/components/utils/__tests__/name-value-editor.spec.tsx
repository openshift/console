import { useState } from 'react';
import type { FC } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NameValueEditor } from '../../../components/utils/name-value-editor';

jest.mock('react-i18next');

/** Keeps nameValuePairs in state so controlled inputs match typed values after updateParentData. */
const NameValueEditorHarness: FC<{
  initialPairs: Array<[string, string, number]>;
  onUpdate: jest.Mock;
}> = ({ initialPairs, onUpdate }) => {
  const [pairs, setPairs] = useState(initialPairs);
  return (
    <NameValueEditor
      nameValuePairs={pairs}
      updateParentData={(data, nameValueId) => {
        setPairs(data.nameValuePairs);
        onUpdate(data, nameValueId);
      }}
      nameValueId={0}
    />
  );
};

describe('NameValueEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User can manage name-value pairs', () => {
    it('allows user to edit existing key and value', async () => {
      const user = userEvent.setup();
      const mockUpdate = jest.fn();

      render(
        <NameValueEditorHarness initialPairs={[['mykey', 'myvalue', 0]]} onUpdate={mockUpdate} />,
      );

      // User can see and edit the key
      const keyInput = screen.getByDisplayValue('mykey');
      await user.clear(keyInput);
      await user.type(keyInput, 'newkey');

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenLastCalledWith(
          {
            nameValuePairs: [['newkey', 'myvalue', 0]],
          },
          0,
        );
      });

      // User can see and edit the value
      const valueInput = screen.getByDisplayValue('myvalue');
      await user.clear(valueInput);
      await user.type(valueInput, 'newvalue');

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenLastCalledWith(
          {
            nameValuePairs: [['newkey', 'newvalue', 0]],
          },
          0,
        );
      });
    });

    it('allows user to add a new pair', async () => {
      const user = userEvent.setup();
      const mockUpdate = jest.fn();

      render(
        <NameValueEditor
          nameValuePairs={[['existing', 'value', 0]]}
          updateParentData={mockUpdate}
          nameValueId={0}
        />,
      );

      // User clicks "Add more" button
      const addButton = screen.getByRole('button', { name: /add more/i });
      await user.click(addButton);

      // Should add a new empty pair
      expect(mockUpdate).toHaveBeenCalledWith(
        {
          nameValuePairs: [
            ['existing', 'value', 0],
            ['', '', 1],
          ],
        },
        0,
      );
    });

    it('allows user to delete a pair', async () => {
      const user = userEvent.setup();
      const mockUpdate = jest.fn();

      render(
        <NameValueEditor
          nameValuePairs={[
            ['key1', 'value1', 0],
            ['key2', 'value2', 1],
          ]}
          updateParentData={mockUpdate}
          nameValueId={0}
        />,
      );

      // User clicks delete button for first pair
      const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
      await user.click(deleteButtons[0]);

      // Should remove the first pair and reindex
      expect(mockUpdate).toHaveBeenCalledWith(
        {
          nameValuePairs: [['key2', 'value2', 0]],
        },
        0,
      );
    });

    it('maintains at least one empty pair when deleting the last pair', async () => {
      const user = userEvent.setup();
      const mockUpdate = jest.fn();

      render(
        <NameValueEditor
          nameValuePairs={[['onlykey', 'onlyvalue', 0]]}
          updateParentData={mockUpdate}
          nameValueId={0}
        />,
      );

      // User deletes the only pair
      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      await user.click(deleteButton);

      // Should replace with empty pair instead of empty array
      expect(mockUpdate).toHaveBeenCalledWith(
        {
          nameValuePairs: [['', '', 0]],
        },
        0,
      );
    });
  });

  describe('Custom labels and headers', () => {
    it('displays custom column headers when provided', () => {
      render(
        <NameValueEditor
          nameValuePairs={[['name', 'value', 0]]}
          updateParentData={() => {}}
          nameString={'foo'}
          valueString={'bar'}
        />,
      );
      expect(screen.getByText('foo')).toBeInTheDocument();
      expect(screen.getByText('bar')).toBeInTheDocument();
    });

    it('displays default column headers when not provided', () => {
      render(
        <NameValueEditor nameValuePairs={[['name', 'value', 0]]} updateParentData={() => {}} />,
      );
      expect(screen.getByText('Key')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
    });
  });

  describe('Read-only mode', () => {
    it('disables inputs and hides action buttons when readOnly is true', () => {
      render(
        <NameValueEditor
          nameValuePairs={[['name', 'value', 0]]}
          updateParentData={() => {}}
          readOnly={true}
          allowSorting={true}
        />,
      );
      expect(screen.getByDisplayValue('name')).toBeDisabled();
      expect(screen.getByDisplayValue('value')).toBeDisabled();
      expect(screen.queryByRole('button', { name: /add more/i })).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Drag to reorder')).not.toBeInTheDocument();
    });
  });

  describe('Sorting functionality', () => {
    it('shows reorder button when allowSorting is true and not readOnly', () => {
      render(
        <NameValueEditor
          nameValuePairs={[
            ['name', 'value', 0],
            ['name2', 'value2', 1],
          ]}
          updateParentData={() => {}}
          readOnly={false}
          allowSorting={true}
        />,
      );
      expect(screen.getAllByLabelText('Drag to reorder')).toHaveLength(2);
    });

    it('hides reorder button when allowSorting is false', () => {
      render(
        <NameValueEditor
          nameValuePairs={[['name', 'value', 0]]}
          updateParentData={() => {}}
          allowSorting={false}
        />,
      );
      expect(screen.queryByLabelText('Drag to reorder')).not.toBeInTheDocument();
    });

    it('disables reorder button when only one pair exists', () => {
      render(
        <NameValueEditor
          nameValuePairs={[['name', 'value', 0]]}
          updateParentData={() => {}}
          readOnly={false}
          allowSorting={true}
        />,
      );
      const reorderButton = screen.getByLabelText('Drag to reorder');
      expect(reorderButton).toBeInTheDocument();
      expect(reorderButton).toBeDisabled();
    });
  });

  describe('User interactions update data correctly', () => {
    it('calls updateParentData with correct parameters when typing', async () => {
      const user = userEvent.setup();
      const mockUpdate = jest.fn();
      render(
        <NameValueEditorHarness initialPairs={[['test', 'value', 0]]} onUpdate={mockUpdate} />,
      );
      const keyInput = screen.getByDisplayValue('test');
      await user.clear(keyInput);
      await user.type(keyInput, 'testX');
      await waitFor(() => {
        expect(mockUpdate).toHaveBeenLastCalledWith(
          {
            nameValuePairs: [['testX', 'value', 0]],
          },
          0,
        );
      });
    });
  });
});
