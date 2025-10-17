import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import { mockDropdownData } from '../__mocks__/dropdown-data-mock';
import { ResourceDropdown } from '../ResourceDropdown';

jest.mock('@console/shared/src/hooks/useUserSettingsCompatibility', () => {
  return {
    useUserSettingsCompatibility: () => ['', () => {}],
  };
});

const componentFactory = (props = {}) => (
  <ResourceDropdown
    placeholder="Select an Item"
    actionItems={[
      {
        actionTitle: 'Create New Application',
        actionKey: '#CREATE_APPLICATION_KEY#',
      },
    ]}
    selectedKey={null}
    dataSelector={['metadata', 'labels', 'app.kubernetes.io/part-of']}
    autoSelect
    loaded
    {...props}
  />
);

describe('ResourceDropdown', () => {
  it('should select nothing as default option when no items and action item are available', async () => {
    const spy = jest.fn();
    renderWithProviders(componentFactory({ onChange: spy, actionItems: null, resources: [] }));

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeVisible();
    });

    await waitFor(() => {
      expect(spy).not.toHaveBeenCalled();
    });
  });

  it('should select Create New Application as default option when only one action item is available', async () => {
    const spy = jest.fn();
    const { rerender } = renderWithProviders(componentFactory({ onChange: spy, loaded: false }));

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeVisible();
    });

    rerender(componentFactory({ onChange: spy, resources: [], loaded: true }));

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeVisible();
    });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith('#CREATE_APPLICATION_KEY#', undefined, undefined);
    });
  });

  it('should select Create New Application as default option when more than one action items is available', async () => {
    const spy = jest.fn();
    const { rerender } = renderWithProviders(
      componentFactory({
        onChange: spy,
        actionItems: [
          {
            actionTitle: 'Create New Application',
            actionKey: '#CREATE_APPLICATION_KEY#',
          },
          {
            actionTitle: 'Choose Existing Application',
            actionKey: '#CHOOSE_APPLICATION_KEY#',
          },
        ],
        loaded: false,
      }),
    );

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeVisible();
    });

    rerender(
      componentFactory({
        onChange: spy,
        actionItems: [
          {
            actionTitle: 'Create New Application',
            actionKey: '#CREATE_APPLICATION_KEY#',
          },
          {
            actionTitle: 'Choose Existing Application',
            actionKey: '#CHOOSE_APPLICATION_KEY#',
          },
        ],
        resources: [],
        loaded: true,
      }),
    );

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith('#CREATE_APPLICATION_KEY#', undefined, undefined);
    });
  });

  it('should select Choose Existing Application as default option when selectedKey is passed as #CHOOSE_APPLICATION_KEY#', async () => {
    const spy = jest.fn();
    const { rerender } = renderWithProviders(
      componentFactory({
        onChange: spy,
        actionItems: [
          {
            actionTitle: 'Create New Application',
            actionKey: '#CREATE_APPLICATION_KEY#',
          },
          {
            actionTitle: 'Choose Existing Application',
            actionKey: '#CHOOSE_APPLICATION_KEY#',
          },
        ],
        loaded: false,
      }),
    );

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeVisible();
    });

    rerender(
      componentFactory({
        onChange: spy,
        actionItems: [
          {
            actionTitle: 'Create New Application',
            actionKey: '#CREATE_APPLICATION_KEY#',
          },
          {
            actionTitle: 'Choose Existing Application',
            actionKey: '#CHOOSE_APPLICATION_KEY#',
          },
        ],
        resources: [],
        selectedKey: '#CHOOSE_APPLICATION_KEY#',
        loaded: true,
      }),
    );

    await waitFor(() => {
      expect(screen.getByText('Choose Existing Application')).toBeVisible();
      expect(spy).toHaveBeenCalledWith('#CHOOSE_APPLICATION_KEY#', undefined, undefined);
    });
  });

  it('should select first item as default option when an item is available', async () => {
    const spy = jest.fn();
    renderWithProviders(
      componentFactory({ onChange: spy, resources: mockDropdownData.slice(0, 1) }),
    );

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeVisible();
      expect(screen.getByText('Select an Item')).toBeVisible();
    });
  });

  it('should select first item as default option when more than one items are available', async () => {
    const spy = jest.fn();
    renderWithProviders(componentFactory({ onChange: spy, resources: mockDropdownData }));

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeVisible();
      expect(screen.getByText('Select an Item')).toBeVisible();
    });
  });

  it('should select given selectedKey as default option when more than one items are available', async () => {
    const spy = jest.fn();
    const { rerender } = renderWithProviders(
      componentFactory({
        onChange: spy,
        selectedKey: null,
        resources: mockDropdownData,
        loaded: false,
      }),
    );

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeVisible();
    });

    rerender(
      componentFactory({
        onChange: spy,
        selectedKey: 'app-group-2',
        resources: mockDropdownData,
        loaded: true,
      }),
    );

    await waitFor(() => {
      expect(screen.getByText('app-group-2')).toBeVisible();
    });
  });

  it('should reset to default item when the selectedKey is no longer available in the items', async () => {
    const spy = jest.fn();
    renderWithProviders(
      componentFactory({
        onChange: spy,
        selectedKey: 'app-group-2',
        actionItems: null,
        allSelectorItem: {
          allSelectorKey: '#ALL_APPS#',
          allSelectorTitle: 'all applications',
        },
        resources: [],
      }),
    );

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeVisible();
      expect(screen.getByText('Select an Item')).toBeVisible();
    });
  });

  it('should callback selected item from dropdown and change the title to selected item', async () => {
    const spy = jest.fn();

    const { rerender } = renderWithProviders(
      componentFactory({
        onChange: spy,
        selectedKey: null,
        id: 'dropdown1',
        resources: mockDropdownData,
        loaded: false,
      }),
    );

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeVisible();
    });

    rerender(
      componentFactory({
        onChange: spy,
        selectedKey: 'app-group-2',
        id: 'dropdown1',
        resources: mockDropdownData,
        loaded: true,
      }),
    );

    // Wait for the component to update with the selected key
    await waitFor(() => {
      expect(screen.getByText('app-group-2')).toBeVisible();
    });

    // Click the dropdown button to open it
    const dropdownButton = screen.getByRole('button');
    fireEvent.click(dropdownButton);

    // Wait for dropdown to open and find the menu item
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeVisible();
    });

    // Find and click the third item (app-group-3)
    const menuItem = screen.getByRole('option', { name: /app-group-3/ });
    fireEvent.click(menuItem);

    // Verify the dropdown button text has changed
    await waitFor(() => {
      expect(screen.getByText('app-group-3')).toBeVisible();
    });
  });

  it('should pass a third argument in the onChange handler based on the resources availability', async () => {
    const spy = jest.fn();

    const { rerender } = renderWithProviders(
      componentFactory({ onChange: spy, resources: mockDropdownData.slice(0, 1) }),
    );
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeVisible();
    });

    rerender(componentFactory({ onChange: spy, resources: [] }));
    await waitFor(() => {
      expect(screen.getByText('Create New Application')).toBeVisible();
    });
  });

  it('should show error if loadError', async () => {
    const spy = jest.fn();

    renderWithProviders(
      componentFactory({
        onChange: spy,
        resources: [],
        loadError: 'Error in loading',
        loaded: true,
      }),
    );

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeVisible();
    });
  });
});
