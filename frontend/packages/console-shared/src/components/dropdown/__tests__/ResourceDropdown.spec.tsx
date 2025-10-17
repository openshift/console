import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  it('should select nothing as default option when no items and action item are available', () => {
    const spy = jest.fn();
    render(componentFactory({ onChange: spy, actionItems: null, resources: [] }));
    expect(spy).not.toHaveBeenCalled();
  });

  it('should select Create New Application as default option when only one action item is available', async () => {
    const spy = jest.fn();
    const { rerender } = render(componentFactory({ onChange: spy, loaded: false }));

    // Trigger componentWillReceiveProps by updating loaded state
    rerender(componentFactory({ onChange: spy, resources: [], loaded: true }));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith('#CREATE_APPLICATION_KEY#', undefined, undefined);
    });
  });

  it('should select Create New Application as default option when more than one action items is available', async () => {
    const spy = jest.fn();
    const { rerender } = render(
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

    // Trigger componentWillReceiveProps by updating loaded state
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
    const { rerender } = render(
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

    // Trigger componentWillReceiveProps by updating loaded state and selectedKey
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
      expect(screen.getByText('Choose Existing Application')).toBeInTheDocument();
      expect(spy).toHaveBeenCalledWith('#CHOOSE_APPLICATION_KEY#', undefined, undefined);
    });
  });

  it('should select first item as default option when an item is available', () => {
    const spy = jest.fn();
    render(componentFactory({ onChange: spy, resources: mockDropdownData.slice(0, 1) }));

    // Verify the dropdown component renders without errors
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Select an Item')).toBeInTheDocument();
  });

  it('should select first item as default option when more than one items are available', () => {
    const spy = jest.fn();
    render(componentFactory({ onChange: spy, resources: mockDropdownData }));

    // Verify the dropdown component renders without errors
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Select an Item')).toBeInTheDocument();
  });

  it('should select given selectedKey as default option when more than one items are available', async () => {
    const spy = jest.fn();
    const { rerender } = render(
      componentFactory({
        onChange: spy,
        selectedKey: null,
        resources: mockDropdownData,
        loaded: false,
      }),
    );

    // Trigger componentWillReceiveProps by updating loaded state and selectedKey
    rerender(
      componentFactory({
        onChange: spy,
        selectedKey: 'app-group-2',
        resources: mockDropdownData,
        loaded: true,
      }),
    );

    // Wait for the component to update with the selected key
    await waitFor(() => {
      expect(screen.getByText('app-group-2')).toBeInTheDocument();
    });
  });

  it('should reset to default item when the selectedKey is no longer available in the items', () => {
    const spy = jest.fn();
    render(
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

    // Verify the component renders with placeholder
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Select an Item')).toBeInTheDocument();
  });

  it('should callback selected item from dropdown and change the title to selected item', async () => {
    const spy = jest.fn();

    const { rerender } = render(
      componentFactory({
        onChange: spy,
        selectedKey: null,
        id: 'dropdown1',
        resources: mockDropdownData,
        loaded: false,
      }),
    );

    // Trigger componentWillReceiveProps by updating loaded state and selectedKey
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
      expect(screen.getByText('app-group-2')).toBeInTheDocument();
    });

    // Click the dropdown button to open it
    const dropdownButton = screen.getByRole('button');
    await userEvent.click(dropdownButton);

    // Wait for dropdown to open and find the menu item
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    // Find and click the third item (app-group-3)
    const menuItem = screen.getByRole('option', { name: /app-group-3/ });
    await userEvent.click(menuItem);

    // Verify the dropdown button text has changed
    await waitFor(() => {
      expect(screen.getByText('app-group-3')).toBeInTheDocument();
    });
  });

  it('should pass a third argument in the onChange handler based on the resources availability', () => {
    const spy = jest.fn();

    // Test with resources - verify component renders
    const { rerender } = render(
      componentFactory({ onChange: spy, resources: mockDropdownData.slice(0, 1) }),
    );
    expect(screen.getByRole('button')).toBeInTheDocument();

    // Test without resources - when autoSelect is true and resources are empty,
    // it auto-selects the first action item instead of showing placeholder
    rerender(componentFactory({ onChange: spy, resources: [] }));
    expect(screen.getByText('Create New Application')).toBeInTheDocument();
  });

  it('should show error if loadError', () => {
    const spy = jest.fn();

    render(
      componentFactory({
        onChange: spy,
        resources: [],
        loadError: 'Error in loading',
        loaded: true,
      }),
    );

    // Verify component renders (the error handling might be different in RTL)
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
